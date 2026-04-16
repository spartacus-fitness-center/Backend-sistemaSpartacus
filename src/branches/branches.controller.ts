import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';

import { BranchesService } from './branches.service';

import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { ResponseBranchDto } from './dto/response-branch.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';

import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) { }

  @Roles('MEMBER')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get("health")
  health(@CurrentUser() user: AuthenticatedUser) {
    return { message: "Si ta jalando", user }
  }

  @ResponseMessage("Usuarios traidos del back")
  @Get('find-all-users')
  async findAllUsers() {
    return await this.branchesService.findAllUsers()
  }

  @ResponseMessage('Branch post successfully')
  @Post()
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @ResponseMessage('Branches found successfully')
  findAll(): Promise<ResponseBranchDto[]> {
    return this.branchesService.findAll();
  }

  @ResponseMessage('Branch foundOne successfully')
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.branchesService.findOne(+id);
  }

  @ResponseMessage('Branch update successfully')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(+id, updateBranchDto);
  }
  @ResponseMessage('Branch delete successfully')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(+id);
  }

  @ResponseMessage('create users successfully')
  @Post('create-users')
  async createUsers(@Body() users) {
    return this.branchesService.createUsers(users)
  }

  
}
