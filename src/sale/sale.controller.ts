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

  @Post('create')
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

// @Post('batch-create')
// @ApiOperation({ summary: 'Create multiple sales with file uploads' })
// @UseInterceptors(
//   FileFieldsInterceptor([
//     { name: 'Receipt', maxCount: 10 }, // Adjust maxCount based on your needs
//   ]),
// )
// async createBatchSales(
//   @UploadedFiles()
//   files: {
//     Receipt?: Express.Multer.File[];
//   },
//   @Body() createSalesDto: CreateSaleDto[],
// ): Promise<Sale[]> {
//   const sales = [];
  
//   try {
//     for (let i = 0; i < createSalesDto.length; i++) {
//       const saleDto = createSalesDto[i];

//       // Handle file uploads if needed
//       if (files.Receipt && files.Receipt[i]) {
//         const imageFilePath = this.fileService.saveFile(files.Receipt[i], '');
//         saleDto.Receipt = path.basename(imageFilePath);
//       }

//       // Create the sale and push it to the sales array
//       const createdSale = await this.saleService.create(saleDto);
//       sales.push(createdSale);
//     }
    
//     return sales;
//   } catch (error) {
//     console.log(error);
//     throw new BadRequestException('Failed to create one or more sales or upload files');
//   }
// }

  @Get('all')
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

  @Get('total-sum/normal')
  @ApiOperation({ summary: 'Get the total sum of all normal returns' })
  async getTotalSumNormal(): Promise<{ totalSum: number }> {
      const totalSum = await this.saleService.calculateTotalSumByReturnReason('normal');
      return { totalSum };
  }

  @Get('total-sum/faulty')
  @ApiOperation({ summary: 'Get the total sum of all faulty returns' })
  async getTotalSumFaulty(): Promise<{ totalSum: number }> {
      const totalSum = await this.saleService.calculateTotalSumByReturnReason('faulty');
      return { totalSum };
  }
  @Get('count-with-credit')
  @ApiOperation({ summary: 'Get total count of sales and count of sales with credit for the current year' })
  async getCountWithCredit(): Promise<{ totalCount: number; creditCount: number }> {
    const counts = await this.saleService.countSalesAndCredit();
    return counts;
  }

  @Get('clients-with-future-credit-due')
  @ApiOperation({ summary: 'Get count of clients whose Credit due is in the future' })
  async getClientsWithFutureCreditDue(): Promise<{ count: number }> {
    const count = await this.saleService.countClientsWithFutureCreditDue();
    return { count };
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific sale by ID' })
  async findById(@Param('id') id: string): Promise<Sale> {
      return this.saleService.findById(id);
  }

  @Get('name/:Full_name')
  @ApiOperation({ summary: 'Get a specific sale by Full Name' })
  async findByFullName(@Param('Full_name') Full_name: string): Promise<Sale[]> {
      return this.saleService.findByFullName(Full_name);
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Get a specific sale by Date' })
  async findByDate(@Param('date') date: string): Promise<Sale[]> {
      return this.saleService.findByDate(new Date(date));
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
