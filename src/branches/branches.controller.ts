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

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) { }

  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get("health")
  health(@CurrentUser() user) {
    return { message: "Si ta jalando", user }
  }

  @Post()
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @ResponseMessage('Branches found successfully')
  findAll(): Promise<ResponseBranchDto[]> {
    return this.branchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.branchesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(+id, updateBranchDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(+id);
  }
}
