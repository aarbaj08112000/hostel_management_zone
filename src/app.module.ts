import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './hostle/modules/api/users/users/guards/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './hostle/entity/typeOrmConfig';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import appConfig from '@repo/source/config/appConfig';
import { MailerModuleWrapper } from '@repo/source/modules/mailer.module';
import { ApiService } from '@repo/source/services/api.service';
import { SettingMiddleware } from '@repo/source/middleware/setting.middleware';
import { SettingEntity } from '@repo/source/entities/setting.entity';
import { CacheService } from '@repo/source/services/cache.service';
import { RedisService } from '@repo/source/services/redis.service';
import { Redis } from 'ioredis';
import { join } from 'path';
import { CoreModule } from './hostle/modules/api/core/core.module';
import { FinanceModule } from './hostle/modules/api/finance/finance.module';
import { OperationsModule } from './hostle/modules/api/operations/operations.module';
import { UsersModule } from './hostle/modules/api/users/users.module';
const redisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: async (configService: ConfigService) => {
    return new Redis({
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
    });
  },
  inject: [ConfigService],
};
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    CoreModule,
    FinanceModule,
    OperationsModule,
    UsersModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        ttl: config.get('app.cache_expiry_time'),
        store: 'memory',
        max: config.get('app.max_cache_allowed'),
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: [
        join(__dirname, '../.env'),
        join(__dirname, '../../../.env'),
      ],
    }),
    MailerModuleWrapper,
    TypeOrmModule.forFeature([SettingEntity]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ApiService,
    CacheService,
    RedisService,
    redisProvider,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SettingMiddleware).forRoutes('*');
  }
}
