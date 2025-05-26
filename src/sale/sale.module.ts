import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from 'src/sale/entities/sale.entity';
import { PaginationModule } from 'src/common/pagination.module';
import { FileService } from '../common/file.service';
import { Stock } from 'src/stock/entities/stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, Stock]),
  PaginationModule
],
  controllers: [SaleController],
  providers: [SaleService, FileService],
  exports: [SaleService] 
})
export class SaleModule {}

