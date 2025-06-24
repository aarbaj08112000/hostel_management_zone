import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CarModule } from './cars/car.model';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './cars/entities/typeOrmConfig';
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
    CarModule,
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
    }),
    MailerModuleWrapper,
    TypeOrmModule.forFeature([SettingEntity]),
  ],
  controllers: [AppController],
  providers: [AppService, ApiService, CacheService,RedisService,redisProvider],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(LoggerMiddleware).forRoutes('*');
    consumer.apply(SettingMiddleware).forRoutes('*');
    // Auth MiddleWare
    // consumer
    //   .apply(AuthMiddleware)
    //   .exclude(...excludeRoutes)
    //   .forRoutes('api/*');
  }
}
