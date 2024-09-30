import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
  BadRequestException,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
} from '@nestjs/common';
import { SaleService } from './sale.service';
import { Sale } from './entities/sale.entity';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { FileService } from '../common/file.service'; 
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';

@Controller('sales')
@UseGuards(AuthGuard)
@ApiTags('Sales')
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create item with file uploads' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'Receipt', maxCount: 1 },
    ]),
  )
  async createItem(
    @UploadedFiles()
    files: {
      Receipt?: Express.Multer.File[];
    },
    @Body() createSaleDto: CreateSaleDto,
  ): Promise<Sale> {
    try {
      if (files.Receipt) {
        const imageFilePath = this.fileService.saveFile(
          files.Receipt[0],
          '',
        );
        createSaleDto.Receipt = path.basename(imageFilePath);
      }

      return await this.saleService.create(createSaleDto);
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to create or upload file');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales with optional pagination' })
  async findAll(
    @Query('page') pageQuery: string = '1',
    @Query('limit') limitQuery: string = '10',
  ): Promise<{ data: Sale[]; total: number }> {
    const page = parseInt(pageQuery, 10);
    const limit = parseInt(limitQuery, 10);

    const result = await this.saleService.findAll(page, limit);

    if (!result.data.length) {
      throw new NotFoundException('No sales found');
    }

    return result;
  }


  @Get('uploads/:filename')
  @ApiOperation({ summary: 'Get uploaded file by filename' })

  async getFile(@Param('filename') filename: string, @Res() res): Promise<any> {
  const filePath = path.join(__dirname, '..', '..', '/uploads', filename); 
  return res.sendFile(filePath);
  }

  @Get('total-sum')
  @ApiOperation({ summary: 'Get the total sum of all sales amounts' })

  async getTotalSum(): Promise<{ totalSum: number }> {
    const totalSum = await this.saleService.calculateTotalSum();
    return { totalSum };
  }
  @Get('total-amount/year')
  @ApiOperation({ summary: 'Get the total amount of sales for the current year' })
  
  async getTotalAmountForCurrentYear() {
    const total = await this.saleService.getTotalAmountForCurrentYear();
    if (!total) {
      throw new BadRequestException('No sales found for the current year');
    }
    return { total };
  }

  @Get('total-amount/month')
  @ApiOperation({ summary: 'Get the total amount of sales for the current month' })
  
  async getTotalAmountForCurrentMonth() {
    const total = await this.saleService.getTotalAmountForCurrentMonth();
    if (!total) {
      throw new BadRequestException('No sales found for the current month');
    }
    return { total };
  }

  @Get('total-amount/day')
  @ApiOperation({ summary: 'Get the total amount of sales for the current day' })
 
  async getTotalAmountForCurrentDay() {
    const total = await this.saleService.getTotalAmountForCurrentDay();
    if (!total) {
      throw new BadRequestException('No sales found for the current day');
    }
    return { total };
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific sale by ID' })
  
  async findOne(@Param('id') id: string): Promise<Sale> {
    return this.saleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific sale by ID' })
 
  async update(
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ): Promise<Sale> {
    try {
      return await this.saleService.update(id, updateSaleDto);
    } catch (error) {
      throw new BadRequestException('Failed to update sale');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific sale by ID' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.saleService.remove(id);
  }
}
