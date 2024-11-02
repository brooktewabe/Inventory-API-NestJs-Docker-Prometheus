import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Category } from './entities/category.entity';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('category')
@UseGuards(AuthGuard)
@ApiTags('Category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('create')
  @ApiOperation({ summary: 'Add new category' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.create(createCategoryDto);
  }


  @Get('all/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategoryById(@Param('id') id: string): Promise<Category> {
    return this.categoryService.findOne(id);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all categories' })
  async getAllCategory(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Delete('all/:id')
  @ApiOperation({ summary: 'Delete a category by ID' })
  async removeCategory(@Param('id') id: string): Promise<void> {
    await this.categoryService.remove(id);
  }
}
