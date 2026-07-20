import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface GformPayload {
  form_id: string;
  submission_id?: string;
  submitted_at?: string;
  answers: Record<string, string>;
}

@Injectable()
export class GformService {
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

  /** Mapping jawaban form ke field Customer */
  private mapAnswersToCustomer(answers: Record<string, string>) {
    const map: Record<string, string> = {
      'nama_customer': 'name',
      'pic_name': 'picName',
      'pic_position': 'picPosition',
      'pic_phone': 'picPhone',
      'pic_email': 'picEmail',
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
    const validLevels = ['low', 'medium', 'hot'];
    if (customer.level && !validLevels.includes(customer.level)) {
      customer.level = 'low';
    }
    if (!customer.level) customer.level = 'low';

    return customer;
  }

  /** Cari atau buat industry dari nama */
  private async resolveIndustry(industryName: string): Promise<string | undefined> {
    if (!industryName) return undefined;
    const existing = await this.prisma.industry.findFirst({
      where: { name: { contains: industryName } },
    });
    if (existing) return existing.id;

    // Buat industry baru jika tidak ditemukan
    const created = await this.prisma.industry.create({
      data: {
        name: industryName,
        code: industryName.substring(0, 10).toUpperCase().replace(/\s/g, '_'),
      },
    });
    return created.id;
  }

  /** Proses webhook: terima data dari Google Forms, buat/update Customer + Prospect */
  async processWebhook(payload: GformPayload, apiKey?: string) {
    await this.validateApiKey(apiKey);
    const { answers } = payload;
    if (!answers || Object.keys(answers).length === 0) {
      throw new BadRequestException('Tidak ada data jawaban dari form');
    }

    // Map ke data customer
    const customerData = this.mapAnswersToCustomer(answers);
    if (!customerData.name) {
      throw new BadRequestException('Field nama_customer wajib diisi');
    }

    // Cari industry jika ada
    if (answers.industri) {
      customerData.industryId = await this.resolveIndustry(answers.industri);
    }
    delete customerData.industri;

    // Cek duplikat: cari customer by name
    let customer = await this.prisma.customer.findFirst({
      where: { name: customerData.name, deletedAt: null },
    });

    let isNew = false;
    if (customer) {
      // Update customer yang sudah ada
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          ...customerData,
          // Jangan overwrite field yang sudah terisi
          code: customer.code || this.generateCode(customerData.name),
          city: customer.city || customerData.city,
          picName: customer.picName || customerData.picName,
          picPhone: customer.picPhone || customerData.picPhone,
        },
      });
    } else {
      isNew = true;
      // Buat customer baru
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
        description: answers.kebutuhan || null,
      },
    });

    // Simpan jawaban sebagai ProspectAnswer (jika ada master question yang cocok)
    // atau simpan sebagai deskripsi / requirements
    for (const [questionKey, answerValue] of Object.entries(answers)) {
      // Skip field yang sudah dipakai untuk customer
      const skipFields = ['nama_customer', 'pic_name', 'pic_position', 'pic_phone',
        'pic_email', 'kota', 'kebutuhan', 'level', 'npwp', 'alamat', 'industri'];
      if (skipFields.includes(questionKey) || !answerValue) continue;

      // Cari master question by text match
      const question = await this.prisma.question.findFirst({
        where: { questionText: { contains: questionKey.replace(/_/g, ' ') } },
      });

      await this.prisma.prospectAnswer.create({
        data: {
          prospectId: prospect.id,
          questionId: question?.id || 'unknown',
          answerText: String(answerValue),
        },
      });
    }

    return {
      success: true,
      customerId: customer.id,
      prospectId: prospect.id,
      customerLevel: customer.level,
      isNew,
    };
  }
}
