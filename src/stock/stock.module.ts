import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from 'src/stock/entities/stock.entity';
import { PaginationModule } from 'src/common/pagination.module';
import { FileService } from '../common/file.service';

@Module({
  imports: [TypeOrmModule.forFeature([Stock]),
  PaginationModule
],
  controllers: [StockController],
  providers: [StockService, FileService],
})
export class StockModule {}

