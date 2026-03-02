import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { BranchesService } from './branches.service';

import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { ResponseBranchDto } from './dto/response-branch.dto';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) { }


  @Get("health")
  health() {
    return "Si ta jalando "
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
