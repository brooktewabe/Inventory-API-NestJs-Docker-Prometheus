import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from './typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { StockModule } from './stock/stock.module';
import { SaleModule } from './sale/sale.module';
import { MovementModule } from './movement/movement.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [ MulterModule.register({
    storage: diskStorage({
      destination: '../uploads',
      filename: (req, file, cb) => {
        cb(null, file.originalname);
      },
    }),
  }),
  ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'uploads'),
    serveRoot:'/uploads/', 
  }),
  ConfigModule.forRoot({
    isGlobal: true,
  }),
    TypeOrmModule.forRoot(config),
  UserModule,
  NotificationModule,
  StockModule,
  SaleModule,
  MovementModule
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
