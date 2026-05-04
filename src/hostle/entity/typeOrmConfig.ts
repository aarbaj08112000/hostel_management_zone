import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { SettingEntity } from '@repo/source/entities/setting.entity';
import { AmenitiesEntity } from '../modules/api/core/amenities/entities/amenities.entity';
import { BedsEntity } from '../modules/api/core/beds/entities/beds.entity';
import { FloorsEntity } from '../modules/api/core/floors/entities/floors.entity';
import { FoodPlansEntity } from '../modules/api/core/food_plans/entities/food_plans.entity';
import { HostelAmenitiesEntity } from '../modules/api/core/hostel_amenities/entities/hostel_amenities.entity';
import { HostelsEntity } from '../modules/api/core/hostels/entities/hostels.entity';
import { RoomsEntity } from '../modules/api/core/rooms/entities/rooms.entity';
import { StudentFoodPlansEntity } from '../modules/api/core/student_food_plans/entities/student_food_plans.entity';
import { DepositsEntity } from '../modules/api/finance/deposits/entities/deposits.entity';
import { InvoicesEntity } from '../modules/api/finance/invoices/entities/invoices.entity';
import { PaymentAllocationsEntity } from '../modules/api/finance/payment_allocations/entities/payment_allocations.entity';
import { PaymentsEntity } from '../modules/api/finance/payments/entities/payments.entity';
import { ComplaintsEntity } from '../modules/api/operations/complaints/entities/complaints.entity';
import { ElectricityReadingsEntity } from '../modules/api/operations/electricity_readings/entities/electricity_readings.entity';
import { MaintenanceRequestsEntity } from '../modules/api/operations/maintenance_requests/entities/maintenance_requests.entity';
import { NotificationsEntity } from '../modules/api/operations/notifications/entities/notifications.entity';
import { VisitorLogsEntity } from '../modules/api/operations/visitor_logs/entities/visitor_logs.entity';
import { StaysEntity } from '../modules/api/users/stays/entities/stays.entity';
import { UsersEntity, AttachmentEntity } from '../modules/api/users/users/entities/users.entity';
import { StudentsEntity } from '../modules/api/users/students/entities/students.entity';
import { SyncElasticEntity } from '@repo/source/entities/elastic_sync.entity';
dotenv.config();
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: process.env.DB_CLIENT as 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [
    SettingEntity,
    AmenitiesEntity,
    BedsEntity,
    FloorsEntity,
    FoodPlansEntity,
    HostelAmenitiesEntity,
    HostelsEntity,
    RoomsEntity,
    StudentFoodPlansEntity,
    DepositsEntity,
    InvoicesEntity,
    PaymentAllocationsEntity,
    PaymentsEntity,
    ComplaintsEntity,
    ElectricityReadingsEntity,
    MaintenanceRequestsEntity,
    NotificationsEntity,
    VisitorLogsEntity,
    StaysEntity,
    UsersEntity,
    StudentsEntity,
    AttachmentEntity,
  ],
  synchronize: false,
  migrationsRun: false,
  logging: false,
  migrations: [__dirname + '/migrations/*.ts'],
  timezone: process.env.TIMEZONE,
};
