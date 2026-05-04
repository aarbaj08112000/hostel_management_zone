import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationsController } from './operations.controller';
import { MaintenanceRequestsService } from './maintenance_requests/services/maintenance_requests.service';
import { ElectricityReadingsService } from './electricity_readings/services/electricity_readings.service';
import { VisitorLogsService } from './visitor_logs/services/visitor_logs.service';
import { ComplaintsService } from './complaints/services/complaints.service';
import { NotificationsService } from './notifications/services/notifications.service';
import { MaintenanceRequestsEntity } from './maintenance_requests/entities/maintenance_requests.entity';
import { ElectricityReadingsEntity } from './electricity_readings/entities/electricity_readings.entity';
import { VisitorLogsEntity } from './visitor_logs/entities/visitor_logs.entity';
import { ComplaintsEntity } from './complaints/entities/complaints.entity';
import { NotificationsEntity } from './notifications/entities/notifications.entity';
import { GlobalModule } from '@repo/source/modules/global.module';
import { MaintenanceRequestsAddService } from './maintenance_requests/services/maintenance_requests.add.service';
import { ElectricityAddReadingsService } from './electricity_readings/services/electricity.add.service';
import { VisitorLogsAddService } from './visitor_logs/services/visitor_logs.add.service';
import { ComplaintsAddService } from './complaints/services/complaints.add.service';
import { NotificationsAddService } from './notifications/services/notifications.add.service';
@Module({
  imports: [
    GlobalModule,
    TypeOrmModule.forFeature([
      MaintenanceRequestsEntity,
      ElectricityReadingsEntity,
      VisitorLogsEntity,
      ComplaintsEntity,
      NotificationsEntity,
    ]),
  ],
  controllers: [OperationsController],
  providers: [
    MaintenanceRequestsService,
    ElectricityReadingsService,
    VisitorLogsService,
    ComplaintsService,
    NotificationsService,
    GlobalModule,
    MaintenanceRequestsAddService,
    ElectricityAddReadingsService,
    VisitorLogsAddService,
    ComplaintsAddService,
    NotificationsAddService
  ],
})
export class OperationsModule {}
