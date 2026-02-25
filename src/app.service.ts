import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {

  constructor(private prisma: PrismaService) { }

  async getHello(): Promise<string> {
    const branches = await this.prisma.branch.findMany();
    console.log(branches)
    return `Hello World! and we have this branches ${JSON.stringify(branches)}`;
  }
}
