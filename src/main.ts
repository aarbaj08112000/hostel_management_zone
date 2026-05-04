import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });
  app.use(cookieParser());
  app.connectMicroservice({
    transport: Transport.TCP,
    options: { port: process.env.MICROSERVICE, host: '0.0.0.0' },
  });

  const config = new DocumentBuilder()
    .setTitle('Hostel Management Backend API')
    .setDescription('Complete API documentation for the Hostel Management System')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices();
  const configService = app.get(ConfigService);
  await app.listen(process.env.PORT ?? 3001);
  app.enableShutdownHooks();
}
bootstrap();
