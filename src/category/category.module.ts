import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Category } from './entities/category.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { SaleModule } from 'src/sale/sale.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    ScheduleModule.forRoot(),
    SaleModule, // Add SaleModule here
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService]
})
export class CategoryModule {}