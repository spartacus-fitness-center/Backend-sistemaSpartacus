import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';

import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseBranchDto } from './dto/response-branch.dto';

import * as bcrypt from 'bcrypt'

@Injectable()
export class BranchesService {

  constructor(private prisma: PrismaService) { }

  async create(createBranchDto: CreateBranchDto): Promise<ResponseBranchDto> {
    const { name } = createBranchDto

    const branchExist = await this.prisma.branch.findUnique({ where: { name } })
    if (branchExist) throw new BadRequestException("Branch already exists");

    const branch = await this.prisma.branch.create({ data: createBranchDto })
    return {
      id: branch.id,
      name: branch.name,
      state: branch.state,
      municipality: branch.municipality,
      latitude: branch.latitude,
      longitude: branch.longitude
    };
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
    return `This action returns a #${id} branch`;
  }

  update(id: number, updateBranchDto: UpdateBranchDto) {
    return `This action updates a #${id} branch`;
  }

  remove(id: number) {
    return `This action removes a #${id} branch`;
  }

  async createUsers(users) {
    const userWithPasswrodHash = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        return { ...user, password: hashedPassword };
      })
    );

    const createdUsers = await this.prisma.$transaction(async (tx) => {
      const newUsers = await tx.user.createManyAndReturn({
        data: userWithPasswrodHash,
      });

      await tx.userAuthDetail.createMany({
        data: newUsers.map((user) => ({
          userId: user.id,
        })),
      });

      return newUsers;
    });

    return createdUsers;
  }

  async findAllUsers() {
    console.log("hola")
    try {
      const users = await this.prisma.user.findMany()
      console.log("Hola", users)
      return users
    } catch (error) {
      console.log(error)
    }
  }
}
