import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cors from 'cors';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    // Load environment variables
    dotenv.config();

  //Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Inventory Management System API')
    .setVersion('1.0')
    .addTag('default')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

//Enable CORS
app.use(cors({
    origin: ["http://localhost:3000","https://akbsproduction.com"],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    credentials: true,
  }));


  await app.listen(5000);
}
bootstrap();
