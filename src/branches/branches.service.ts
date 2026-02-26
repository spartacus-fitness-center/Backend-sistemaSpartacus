import { Injectable } from '@nestjs/common';

import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseBranchDto } from './dto/response-branch.dto';

import { DefaultResponse } from 'src/default-response';



@Injectable()
export class BranchesService {

  constructor(private prisma: PrismaService) { }

  create(createBranchDto: CreateBranchDto) {
    return 'This action adds a new branch';
  }

  async findAll(): Promise<DefaultResponse<ResponseBranchDto[]>> {
    const branches = await this.prisma.branch.findMany({
      select:
      {
        id: true,
        name: true,
        state: true,
        municipality: true,
        latitude: true,
        longitude: true
      }
    });
    return new DefaultResponse(branches, "Branches found successfully")
  }

  findOne(id: number) {
    return `This action returns a #${id} branch`;
  }

  update(id: number, updateBranchDto: UpdateBranchDto) {
    return `This action updates a #${id} branch`;
  }

  remove(id: number) {
    return `This action removes a #${id} branch`;
  }
}
