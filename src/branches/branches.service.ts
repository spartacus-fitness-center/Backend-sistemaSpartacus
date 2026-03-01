import { Injectable, UnauthorizedException } from '@nestjs/common';

import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseBranchDto } from './dto/response-branch.dto';

// import * as bcrypt from 'bcrypt'

@Injectable()
export class BranchesService {

  constructor(private prisma: PrismaService) { }

  create(createBranchDto: CreateBranchDto) {
    console.log(createBranchDto)
    return 'This action adds a new branch';
  }

  async findAll(): Promise<ResponseBranchDto[]> {
    const branches = await this.prisma.branch.findMany({
      select:
      {
        id: true,
        name: true,
        state: true,
        municipality: true,
        latitude: true,
        longitude: true,
      }
    });
    return branches
  }

  async findOne(id: number) {
    // const password = await bcrypt.hash("1234", 10)
    // const data = await this.prisma.user.create({
    //   data: {
    //     email: "avalosalan@gmail.com",
    //     name: "Alan",
    //     password,
    //     branchId: "11111111-1111-1111-1111-111111111111",
    //     phone: "4281108561",
    //   }
    // })

    // const data = await this.prisma.branch.findMany({ select: { users: { select: { name: true } } } })

    // console.log(data)
    return `This action returns a #${id} branch`;
  }

  update(id: number, updateBranchDto: UpdateBranchDto) {
    return `This action updates a #${id} branch`;
  }

  remove(id: number) {
    return `This action removes a #${id} branch`;
  }
}
