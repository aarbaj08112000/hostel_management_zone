import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import * as cookieParser from 'cookie-parser';
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
    options: { port: process.env.MICROSERVICE }, 
  });
  await app.startAllMicroservices();
  console.log( process.env.MICROSERVICE)
  const configService = app.get(ConfigService);
  await app.listen(process.env.PORT ?? 3001);
  app.enableShutdownHooks();

}
bootstrap();
