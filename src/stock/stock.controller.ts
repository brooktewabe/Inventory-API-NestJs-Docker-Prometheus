import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  BadRequestException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import * as path from 'path';
import { lookup } from 'mime-types';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream, existsSync } from 'fs';
import { Stock } from './entities/stock.entity';
import { FileService } from 'src/common/file.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/User.decorators';
import { User } from 'src/user/entities/user.entity';

@Controller('stock')
@UseGuards(AuthGuard)
@ApiTags('Stock')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly fileService: FileService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create stock with optional photo upload' })
  @UseInterceptors(FileInterceptor('file'))
  async createStock(
    @UploadedFile() file: Express.Multer.File,
    @Body() createStockDto: CreateStockDto,
    @CurrentUser() user: User,
  ): Promise<Stock> {
    try {
      return await this.stockService.create(createStockDto, user, file);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all stocks with optional pagination' })
  async findAll(
    @Query('page') pageQuery: string = '1',
    @Query('limit') limitQuery: string = '25',
  ): Promise<{ data: Stock[]; total: number }> {
    const page = parseInt(pageQuery, 10) || 1;
    const limit = parseInt(limitQuery, 10) || 25;

    const result = await this.stockService.findAll(page, limit);

    if (!result.data.length) {
      throw new NotFoundException('No stocks found');
    }

    return result;
  }

  @Get('all/:id')
  @ApiOperation({ summary: 'Get a specific stock by ID' })
  async findOne(@Param('id') id: string): Promise<Stock> {
    const stock = await this.stockService.findOne(id);
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }
    return stock;
  }

  @Get('image/:filename')
  @ApiOperation({ summary: 'Get stock photo' })
  getPhoto(
    @Param('filename') filename: string,
    @Res() response: ExpressResponse,
  ) {
    const filePath = path.join(__dirname, `../../uploads/stock-images/${filename}`);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const mimeType = lookup(filePath);
    response.setHeader('Content-Type', mimeType || 'application/octet-stream');
    response.setHeader('Content-Disposition', `inline; filename=${filename}`);

    createReadStream(filePath).pipe(response);
  }

  @Patch('all/:id')
  @ApiOperation({ summary: 'Update a stock with optional photo upload' })
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateStockDto: UpdateStockDto,
    @CurrentUser() user: User,
  ): Promise<Stock> {
    try {
      return await this.stockService.update(id, updateStockDto, user, file);
    } catch (error) {
      throw new BadRequestException('Failed to update stock or upload image');
    }
  }
  @Get('total/total-stock')
  @ApiOperation({ summary: 'Get the total sum of all stock' })
  async getTotalSum(): Promise<{ totalSum: number }> {
    const totalSum = await this.stockService.calculateTotalSum();
    return { totalSum };
  }
  @Delete('all/:id')
  @ApiOperation({ summary: 'Delete a specific stock by ID' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.stockService.remove(id);
  }
}
