import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { GformWebhookDto } from './dto/gform-webhook.dto';
import { configCache } from '../common/cache.util';

@Injectable()
export class GformService {
  private readonly logger = new Logger(GformService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Validasi API Key dari IntegrationConfiguration */
  private async validateApiKey(key: string | undefined): Promise<void> {
    if (!key) throw new UnauthorizedException('API Key diperlukan');
    const config = await this.prisma.integrationConfiguration.findUnique({
      where: { key: 'gform_api_key' },
    });
    if (!config || !(await bcrypt.compare(key, config.valueEncrypted))) {
      throw new UnauthorizedException('API Key tidak valid');
    }
  }

  /** Generate kode customer dari nama */
  private generateCode(name: string): string {
    const words = name.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/);
    if (words.length >= 2) {
      return words.map(w => w.substring(0, 2).toUpperCase()).join('').substring(0, 10);
    }
    return name.substring(0, 5).toUpperCase();
  }

  /** Cari branch/org unit berdasarkan kode */
  private async resolveBranch(
    tx: any,
    branchCode?: string,
  ): Promise<{ id: string; name: string } | null> {
    if (!branchCode) return null;
    const unit = await tx.orgUnit.findFirst({
      where: {
        OR: [
          { code: { equals: branchCode, mode: 'insensitive' } },
          { name: { contains: branchCode, mode: 'insensitive' } },
        ],
        unitType: 'branch',
        isActive: true,
      },
    });
    return unit ? { id: unit.id, name: unit.name } : null;
  }

  /** Mapping jawaban form ke field Customer */
  private mapAnswersToCustomer(answers: Record<string, string>) {
    const map: Record<string, string> = {
      'nama_customer': 'name',
      'nama_perusahaan': 'name',
      'pic_name': 'picName',
      'nama_pic': 'picName',
      'pic_position': 'picPosition',
      'jabatan_pic': 'picPosition',
      'pic_phone': 'picPhone',
      'no_hp_pic': 'picPhone',
      'telp_pic': 'picPhone',
      'pic_email': 'picEmail',
      'email_pic': 'picEmail',
      'kota': 'city',
      'kebutuhan': 'requirements',
      'level': 'level',
      'npwp': 'npwp',
      'alamat': 'address',
      'tipe_perusahaan': 'type',
      'jenis_perusahaan': 'type',
      'provider_existing': 'providerExisting',
    };

    const customer: Record<string, any> = {
      source: 'Google Form',
      needsVerification: true,
    };

    for (const [formKey, fieldName] of Object.entries(map)) {
      if (answers[formKey]) {
        customer[fieldName] = answers[formKey];
      }
    }

    // Valid & default level
    if (customer.level) {
      const normalized = (customer.level as string).toLowerCase().trim();
      const validLevels = ['low', 'medium', 'hot'];
      customer.level = validLevels.includes(normalized) ? normalized : 'low';
    } else {
      customer.level = 'low';
    }

    // Valid & default tipe perusahaan
    if (customer.type) {
      const normalized = (customer.type as string).toLowerCase().trim();
      const validTypes = ['swasta', 'bumn', 'pemerintah', 'asing'];
      customer.type = validTypes.includes(normalized) ? normalized : 'swasta';
    } else {
      customer.type = 'swasta';
    }

    return customer;
  }

  /** Cari atau buat industry dari nama */
  private async resolveIndustry(tx: any, industryName: string): Promise<string | undefined> {
    if (!industryName) return undefined;
    const normalized = industryName.trim();
    const existing = await tx.industry.findFirst({
      where: { name: { contains: normalized, mode: 'insensitive' } },
    });
    if (existing) return existing.id;

    const created = await tx.industry.create({
      data: {
        name: normalized,
        code: normalized.substring(0, 10).toUpperCase().replace(/\s/g, '_'),
      },
    });
    return created.id;
  }

  /** Cari customer berdasarkan multiple field untuk deduplikasi lebih baik */
  private async findExistingCustomer(tx: any, data: Record<string, any>): Promise<{ id: string } | null> {
    if (data.picPhone) {
      const byPhone = await tx.customer.findFirst({
        where: { picPhone: data.picPhone, deletedAt: null },
      });
      if (byPhone) return byPhone;
    }

    if (data.name) {
      const byName = await tx.customer.findFirst({
        where: { name: { equals: data.name, mode: 'insensitive' }, deletedAt: null },
      });
      if (byName) return byName;
    }

    if (data.picEmail) {
      const byEmail = await tx.customer.findFirst({
        where: { picEmail: data.picEmail, deletedAt: null },
      });
      if (byEmail) return byEmail;
    }

    return null;
  }

  /** Proses webhook: terima data dari Google Forms, buat/update Customer + Prospect */
  async processWebhook(payload: GformWebhookDto, apiKey?: string) {
    await this.validateApiKey(apiKey);
    const { answers } = payload;

    if (!answers || Object.keys(answers).length === 0) {
      throw new BadRequestException('Tidak ada data jawaban dari form');
    }

    // Map ke data customer
    const customerData = this.mapAnswersToCustomer(answers);
    if (!customerData.name) {
      throw new BadRequestException('Field nama_customer / nama_perusahaan wajib diisi');
    }

    try {
      // Pre-fetch all questions dari cache (master data, jarang berubah)
      const allQuestions = await configCache.getOrFetch('gform_questions', () =>
        this.prisma.question.findMany({ select: { id: true, questionText: true } }),
        300_000, // TTL 5 menit
      );

      return await this.prisma.$transaction(async (tx) => {
        // Cari industry
        const industryKey = answers.industri || answers.industry || answers.bidang_usaha;
        if (industryKey) {
          customerData.industryId = await this.resolveIndustry(tx, industryKey);
        }

        // Resolve branch
        const branch = await this.resolveBranch(tx, payload.branch_code);
        const branchName = branch?.name || answers.cabang || null;

        // Cek duplikat
        const existing = await this.findExistingCustomer(tx, customerData);
        let customer: any;
        let isNew = false;

        if (existing) {
          const updateData: any = { ...customerData };
          delete updateData.source;
          delete updateData.needsVerification;
          delete updateData.name;

          customer = await tx.customer.update({
            where: { id: existing.id },
            data: {
              ...updateData,
              code: customerData.code || this.generateCode(customerData.name),
              city: customerData.city ? customerData.city : undefined,
              picName: customerData.picName ? customerData.picName : undefined,
              picPhone: customerData.picPhone ? customerData.picPhone : undefined,
            } as any,
          });
        } else {
          isNew = true;
          customer = await tx.customer.create({
            data: {
              name: customerData.name,
              code: this.generateCode(customerData.name),
              type: 'swasta',
              city: customerData.city || '',
              picName: customerData.picName || '',
              picPosition: customerData.picPosition || '',
              picPhone: customerData.picPhone || '',
              picEmail: customerData.picEmail,
              npwp: customerData.npwp,
              address: customerData.address,
              level: customerData.level,
              industryId: customerData.industryId,
              requirements: customerData.requirements,
              source: customerData.source,
              needsVerification: customerData.needsVerification,
            } as any,
          });
        }

        // Buat prospect baru
        const prospect = await tx.prospect.create({
          data: {
            name: customerData.name,
            client: customerData.name,
            customerId: customer.id,
            customerType: 'new',
            status: 'Lead',
            source: 'Google Form',
            branch: branchName,
            description: answers.kebutuhan || answers.deskripsi || null,
          },
        });

        // Simpan jawaban sebagai ProspectAnswer (pakai cached questions, batch upsert)
        await this.saveProspectAnswers(tx, prospect.id, answers, allQuestions);

        this.logger.log(`Google Form → Customer:${customer.id} (${isNew ? 'baru' : 'update'}), Prospect:${prospect.id}`);

        return {
          success: true,
          customerId: customer.id,
          prospectId: prospect.id,
          customerLevel: customer.level,
          isNew,
          branch: branchName,
        };
      });
    } catch (error: any) {
      this.logger.error(`GForm webhook gagal: ${error.message}`, error.stack);
      throw error;
    }
  }

  /** Simpan jawaban form sebagai ProspectAnswer — batch upsert pakai cached questions */
  private async saveProspectAnswers(
    tx: any,
    prospectId: string,
    answers: Record<string, string>,
    questions: { id: string; questionText: string }[],
  ) {
    const skipFields = [
      'nama_customer', 'nama_perusahaan', 'pic_name', 'nama_pic',
      'pic_position', 'jabatan_pic', 'pic_phone', 'no_hp_pic', 'telp_pic',
      'pic_email', 'email_pic', 'kota', 'kebutuhan', 'deskripsi',
      'level', 'npwp', 'alamat', 'industri', 'industry', 'bidang_usaha', 'cabang',
    ];

    // Filter field yang perlu dicari question-nya
    const answerEntries = Object.entries(answers).filter(
      ([key, val]) => !skipFields.includes(key) && val,
    );
    if (answerEntries.length === 0) return;

    // Build lookup dari cached questions: cari questionId berdasarkan key
    const questionMap = new Map<string, string>();
    for (const [key] of answerEntries) {
      const searchKey = key.replace(/_/g, ' ').toLowerCase();
      const match = questions.find(q =>
        q.questionText.toLowerCase().includes(searchKey),
      );
      if (match) questionMap.set(key, match.id);
    }

    // Batch upsert semua jawaban (tidak sequential)
    await Promise.all(
      answerEntries.map(async ([key, value]) => {
        const questionId = questionMap.get(key);
        if (!questionId) return;
        return tx.prospectAnswer.upsert({
          where: {
            prospectId_questionId: {
              prospectId,
              questionId,
            },
          },
          create: {
            prospectId,
            questionId,
            answerText: String(value),
          },
          update: {
            answerText: String(value),
          },
        });
      }),
    );
  }
}
