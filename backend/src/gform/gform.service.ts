import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface GformPayload {
  form_id: string;
  branch_code?: string;
  submission_id?: string;
  submitted_at?: string;
  answers: Record<string, string>;
}

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
    if (!config || config.valueEncrypted !== key) {
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
  private async resolveBranch(branchCode?: string): Promise<{ id: string; name: string } | null> {
    if (!branchCode) return null;
    const unit = await this.prisma.orgUnit.findFirst({
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

    return customer;
  }

  /** Cari atau buat industry dari nama */
  private async resolveIndustry(industryName: string): Promise<string | undefined> {
    if (!industryName) return undefined;
    const normalized = industryName.trim();
    const existing = await this.prisma.industry.findFirst({
      where: { name: { contains: normalized, mode: 'insensitive' } },
    });
    if (existing) return existing.id;

    const created = await this.prisma.industry.create({
      data: {
        name: normalized,
        code: normalized.substring(0, 10).toUpperCase().replace(/\s/g, '_'),
      },
    });
    return created.id;
  }

  /** Cari customer berdasarkan multiple field untuk deduplikasi lebih baik */
  private async findExistingCustomer(data: Record<string, any>): Promise<{ id: string } | null> {
    if (data.picPhone) {
      const byPhone = await this.prisma.customer.findFirst({
        where: { picPhone: data.picPhone, deletedAt: null },
      });
      if (byPhone) return byPhone;
    }

    if (data.name) {
      const byName = await this.prisma.customer.findFirst({
        where: { name: { equals: data.name, mode: 'insensitive' }, deletedAt: null },
      });
      if (byName) return byName;
    }

    if (data.picEmail) {
      const byEmail = await this.prisma.customer.findFirst({
        where: { picEmail: data.picEmail, deletedAt: null },
      });
      if (byEmail) return byEmail;
    }

    return null;
  }

  /** Proses webhook: terima data dari Google Forms, buat/update Customer + Prospect */
  async processWebhook(payload: GformPayload, apiKey?: string) {
    await this.validateApiKey(apiKey);
    const { answers, branch_code } = payload;

    if (!answers || Object.keys(answers).length === 0) {
      throw new BadRequestException('Tidak ada data jawaban dari form');
    }

    // Map ke data customer
    const customerData = this.mapAnswersToCustomer(answers);
    if (!customerData.name) {
      throw new BadRequestException('Field nama_customer / nama_perusahaan wajib diisi');
    }

    try {
      // Cari industry
      const industryKey = answers.industri || answers.industry || answers.bidang_usaha;
      if (industryKey) {
        customerData.industryId = await this.resolveIndustry(industryKey);
      }

      // Resolve branch
      const branch = await this.resolveBranch(branch_code);
      const branchName = branch?.name || answers.cabang || null;

      // Cek duplikat lebih baik
      const existing = await this.findExistingCustomer(customerData);
      let customer: any;
      let isNew = false;

      if (existing) {
        // Update customer yang sudah ada dengan data baru
        const updateData: any = { ...customerData };
        delete updateData.source;
        delete updateData.needsVerification;
        delete updateData.name;

        customer = await this.prisma.customer.update({
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
        customer = await this.prisma.customer.create({
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
      const prospect = await this.prisma.prospect.create({
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

      // Simpan jawaban sebagai ProspectAnswer
      const skipFields = [
        'nama_customer', 'nama_perusahaan', 'pic_name', 'nama_pic',
        'pic_position', 'jabatan_pic', 'pic_phone', 'no_hp_pic', 'telp_pic',
        'pic_email', 'email_pic', 'kota', 'kebutuhan', 'deskripsi',
        'level', 'npwp', 'alamat', 'industri', 'industry', 'bidang_usaha', 'cabang',
      ];

      for (const [questionKey, answerValue] of Object.entries(answers)) {
        if (skipFields.includes(questionKey) || !answerValue) continue;

        const question = await this.prisma.question.findFirst({
          where: {
            OR: [
              { questionText: { contains: questionKey.replace(/_/g, ' '), mode: 'insensitive' } },
              { questionText: { contains: questionKey, mode: 'insensitive' } },
            ],
          },
        });

        if (question) {
          await this.prisma.prospectAnswer.upsert({
            where: {
              prospectId_questionId: {
                prospectId: prospect.id,
                questionId: question.id,
              },
            },
            create: {
              prospectId: prospect.id,
              questionId: question.id,
              answerText: String(answerValue),
            },
            update: {
              answerText: String(answerValue),
            },
          });
        }
      }

      this.logger.log(`Google Form → Customer:${customer.id} (${isNew ? 'baru' : 'update'}), Prospect:${prospect.id}`);

      return {
        success: true,
        customerId: customer.id,
        prospectId: prospect.id,
        customerLevel: customer.level,
        isNew,
        branch: branchName,
      };
    } catch (error: any) {
      this.logger.error(`GForm webhook gagal: ${error.message}`, error.stack);
      throw error;
    }
  }
}
