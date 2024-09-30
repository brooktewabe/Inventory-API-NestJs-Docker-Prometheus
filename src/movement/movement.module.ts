import { Module } from '@nestjs/common';
import { MovementService } from './movement.service'
import { MovementController } from './movement.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movement } from 'src/movement/entities/movement.entity';
import { PaginationModule } from 'src/common/pagination.module';
import { FileService } from '../common/file.service';

@Module({
  imports: [TypeOrmModule.forFeature([Movement]),
  PaginationModule
],
  controllers: [MovementController],
  providers: [MovementService, FileService],
})
export class MovementModule {}

