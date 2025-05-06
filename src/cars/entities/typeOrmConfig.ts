import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { SettingEntity } from '@repo/source/entities/setting.entity';
import {LookupEntity}  from '@repo/source/entities/lookup.entity';
import { ActivityMasterEntity } from '@repo/source/entities/activity-master.entity';
import { ActivityLogEntity } from '@repo/source/entities/activity-log.entity';
import { SyncElasticEntity } from '@repo/source/entities/elastic_sync.entity';
import { ActivityLogEntity } from '@repo/source/entities/activity-log.entity';
import { ActivityMasterEntity } from '@repo/source/entities/activity-master.entity';
dotenv.config();
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: process.env.DB_CLIENT as 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [ActivityLogEntity,ActivityMasterEntity,SettingEntity, SyncElasticEntity,LookupEntity,join(__dirname, '*.entity{.ts,.js}')],
  synchronize: false,
  migrationsRun: false,
  logging: false,
  migrations: [__dirname + '/migrations/*.ts'],
};
