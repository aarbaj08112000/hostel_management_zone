import { Body, Controller, Get, Post, Req, Param, Patch, Delete, Query, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { MaintenanceRequestsService } from './maintenance_requests/services/maintenance_requests.service';
import { ElectricityReadingsService } from './electricity_readings/services/electricity_readings.service';
import { VisitorLogsService } from './visitor_logs/services/visitor_logs.service';
import { ComplaintsService } from './complaints/services/complaints.service';
import { NotificationsService } from './notifications/services/notifications.service';
import { MaintenanceRequestsDto, UpdateMaintenanceRequestsDto } from './maintenance_requests/dto/maintenance_requests.dto';
import { ElectricityReadingsDto, UpdateElectricityReadingsDto } from './electricity_readings/dto/electricity_readings.dto';
import { VisitorLogsDto } from './visitor_logs/dto/visitor_logs.dto';
import { ComplaintsDto, UpdateComplaintsDto } from './complaints/dto/complaints.dto';
import { NotificationsDto } from './notifications/dto/notifications.dto';
import { MaintenanceRequestsAddService } from './maintenance_requests/services/maintenance_requests.add.service';
import { ElectricityAddReadingsService } from './electricity_readings/services/electricity.add.service';
import { VisitorLogsAddService } from './visitor_logs/services/visitor_logs.add.service';
import { ComplaintsAddService } from './complaints/services/complaints.add.service';
import { NotificationsAddService } from './notifications/services/notifications.add.service';

import { ListDto } from 'src/hostle/dto/common-list.dto';
import { DetailDto } from 'src/hostle/dto/common-detail.dto';
@Controller('operations')
export class OperationsController {
  constructor(
    private readonly maintenance_requestsService: MaintenanceRequestsService,
    private readonly electricity_readingsService: ElectricityReadingsService,
    private readonly visitor_logsService: VisitorLogsService,
    private readonly complaintsService: ComplaintsService,
    private readonly notificationsService: NotificationsService,
    private readonly maintenance_requestsAddService: MaintenanceRequestsAddService,
    private readonly electricity_readingsAddService: ElectricityAddReadingsService,
    private readonly visitor_logsAddService: VisitorLogsAddService,
    private readonly complaintsAddService: ComplaintsAddService,
    private readonly notificationsAddService: NotificationsAddService,
  ) { }

  @Get()
  async sayHello() {
    return 'hello oprations';
  }

  // Maintenance Requests
  @Post('maintenance-requests-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addMaintenanceRequest(@Req() req: Request, @Body() body: MaintenanceRequestsDto) {
    return await this.maintenance_requestsAddService.startMaintenanceAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('maintenance-requests-update/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateMaintenanceRequest(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateMaintenanceRequestsDto) {
    return await this.maintenance_requestsAddService.startMaintenanceUpdate(req, { ...body, id, files: (req as any).files });
  }

  // Electricity Readings
  @Post('electricity-readings-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addElectricityReading(@Req() req: Request, @Body() body: ElectricityReadingsDto) {
    return await this.electricity_readingsAddService.startAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('electricity-readings-update/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateElectricityReading(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateElectricityReadingsDto) {
    return await this.electricity_readingsAddService.startUpdate(req, { ...body, id, files: (req as any).files });
  }
  @Delete('electricity-readings-delete/:id')
  async deleteElectricityReading(@Param('id') id: string) {
    return await this.electricity_readingsAddService.delete(Number(id));
  }

  // Visitor Logs
  @Post('visitor-logs-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addVisitorLog(@Req() req: Request, @Body() body: VisitorLogsDto) {
    return await this.visitor_logsAddService.startVisitorAdd(req, { ...body, files: (req as any).files });
  }

  // Complaints
  @Post('complaints-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addComplaint(@Req() req: Request, @Body() body: ComplaintsDto) {
    return await this.complaintsAddService.startComplaintAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('complaints-update/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateComplaint(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateComplaintsDto) {
    return await this.complaintsAddService.startComplaintUpdate(req, { ...body, id, files: (req as any).files });
  }

  // Notifications
  @Post('notifications-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addNotification(@Req() req: Request, @Body() body: NotificationsDto) {
    return await this.notificationsAddService.startNotificationAdd(req, { ...body, files: (req as any).files });
  }
  @Get('maintenance-requests-list')
  async getmaintenancerequestsList(@Req() req: Request, @Query() query: ListDto) {
    return await this.maintenance_requestsService.startMaintenanceRequests(req, query);
  }

  @Get('maintenance-requests-details/:id')
  async getmaintenancerequestsDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.maintenance_requestsService.startMaintenanceRequestDetails(req, { id });
  }

  @Get('electricity-readings-list')
  async getelectricityreadingsList(@Req() req: Request, @Query() query: ListDto) {
    return await this.electricity_readingsService.startElectricityReadings(req, query);
  }

  @Get('electricity-readings-details/:id')
  async getelectricityreadingsDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.electricity_readingsService.startElectricityReadingDetails(req, { id });
  }

  @Get('visitor-logs-list')
  async getvisitorlogsList(@Req() req: Request, @Query() query: ListDto) {
    return await this.visitor_logsService.startVisitorLogs(req, query);
  }

  @Get('visitor-logs-details/:id')
  async getvisitorlogsDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.visitor_logsService.startVisitorLogDetails(req, { id });
  }

  @Get('complaints-list')
  async getcomplaintsList(@Req() req: Request, @Query() query: ListDto) {
    return await this.complaintsService.startComplaints(req, query);
  }

  @Get('complaints-details/:id')
  async getcomplaintsDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.complaintsService.startComplaintDetails(req, { id });
  }

  @Get('notifications-list')
  async getnotificationsList(@Req() req: Request, @Query() query: ListDto) {
    return await this.notificationsService.startNotifications(req, query);
  }

  @Get('notifications-details/:id')
  async getnotificationsDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.notificationsService.startNotificationDetails(req, { id });
  }

}
