import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from 'src/stock/entities/stock.entity';
import { PaginationModule } from 'src/common/pagination.module';
import { FileService } from '../common/file.service';
import { MovementModule } from 'src/movement/movement.module';
import { NotificationModule } from 'src/notification/notification.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Stock]),
  PaginationModule,
  MovementModule,
  NotificationModule,
  UserModule
],
  controllers: [StockController],
  providers: [StockService, FileService],
})
export class StockModule {}

