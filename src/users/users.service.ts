import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import type { MeResponseDto } from './dto/me-response.dto';
import { MemberMeResponseDto, CoachMeResponseDto, AdminMeResponseDto, SuperAdminMeResponseDto } from './dto/me-response.dto';
import { Role } from 'generated/prisma/enums';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  private async getMemberProfile(id: string): Promise<MemberMeResponseDto> {
    const member = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, role: true, emailIsVerified: true,
        branch: { select: { id: true, name: true, municipality: true, state: true } },
        memberProfile: {
          select: {
            memberNumber: true, weight: true, height: true, goal: true, birthdate: true, streak: true, isProfileCompleted: true,
            coach: { select: { id: true, name: true } }
          }
        }
      }
    })

    if (!member) throw new NotFoundException('User not found');

    return member
  }

  private async getCoachProfile(id: string): Promise<CoachMeResponseDto> {
    const coach = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, role: true, emailIsVerified: true,
        branch: { select: { id: true, name: true, municipality: true, state: true } },
        _count: { select: { coachedMembers: true } }
      }
    })

    if (!coach) throw new NotFoundException('User not found');

    const { _count, ...coachData } = coach
    return { ...coachData, coachedMembers: _count.coachedMembers }
  }

  private async getAdminProfile(id: string): Promise<AdminMeResponseDto> {
    const admin = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, role: true, emailIsVerified: true,
        branch: { select: { id: true, name: true, municipality: true, state: true } },
      }
    })

    if (!admin) throw new NotFoundException('User not found');

    return admin
  }
  
  private async getSuperAdminProfile(id: string): Promise<SuperAdminMeResponseDto> {
    const superAdmin = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, role: true, emailIsVerified: true,
      }
    })

    if (!superAdmin) throw new NotFoundException('User not found');

    return superAdmin
  }

  async getMe(id: string, role: Role): Promise<MeResponseDto> {
    let me: MeResponseDto

    switch (role) {
      case 'MEMBER':
        me = await this.getMemberProfile(id);
        break;
      case 'COACH':
        me = await this.getCoachProfile(id)
        break;
      case 'ADMIN':
        me = await this.getAdminProfile(id)
        break;
      case 'SUPER_ADMIN':
        me = await this.getSuperAdminProfile(id)
        break;
      default:
        throw new InternalServerErrorException('Invalid role assigned to user')
    }

    return me;
  }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
