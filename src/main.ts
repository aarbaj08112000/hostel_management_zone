import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as crypto from 'crypto';

if (!global.crypto) {
  (global as any).crypto = crypto;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static assets from public dir
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public/',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
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
  console.log(process.env)
  await app.listen(process.env.PORT ?? 3001);
  app.enableShutdownHooks();
}
bootstrap();
