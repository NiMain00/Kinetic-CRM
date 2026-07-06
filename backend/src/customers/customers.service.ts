import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { page?: number; search?: string; type?: string }) {
    const where: any = { deletedAt: null };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { code: { contains: params.search } },
      ];
    }
    if (params.type) where.type = params.type;

    const page = params.page || 1;
    const perPage = 20;
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { name: 'asc' } }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  async get(id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(data: any) {
    return this.prisma.customer.create({ data });
  }

  async update(id: string, data: any) {
    await this.get(id);
    return this.prisma.customer.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.get(id);
    return this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
