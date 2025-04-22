import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { SettingEntity } from '@repo/source/entities/setting.entity';
import {LookupEntity}  from '@repo/source/entities/lookup.entity';
import { SyncElasticEntity } from '@repo/source/entities/elastic_sync.entity';
dotenv.config();
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: process.env.DB_CLIENT as 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [SettingEntity, SyncElasticEntity,LookupEntity,join(__dirname, '*.entity{.ts,.js}')],
  synchronize: false,
  migrationsRun: false,
  logging: false,
  migrations: [__dirname + '/migrations/*.ts'],
};
