import { Body, Controller, Get, Post, Req } from '@nestjs/common';
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
  async addMaintenanceRequest(@Req() req: Request, @Body() body: MaintenanceRequestsDto) {
    return await this.maintenance_requestsAddService.startMaintenanceAdd(req, body);
  }
  @Post('maintenance-requests-update')
  async updateMaintenanceRequest(@Req() req: Request, @Body() body: UpdateMaintenanceRequestsDto) {
    return await this.maintenance_requestsAddService.startMaintenanceUpdate(req, body);
  }

  // Electricity Readings
  @Post('electricity-readings-add')
  async addElectricityReading(@Req() req: Request, @Body() body: ElectricityReadingsDto) {
    return await this.electricity_readingsAddService.startAdd(req, body);
  }
  @Post('electricity-readings-update')
  async updateElectricityReading(@Req() req: Request, @Body() body: UpdateElectricityReadingsDto) {
    return await this.electricity_readingsAddService.startUpdate(req, body);
  }

  // Visitor Logs
  @Post('visitor-logs-add')
  async addVisitorLog(@Req() req: Request, @Body() body: VisitorLogsDto) {
    return await this.visitor_logsAddService.startVisitorAdd(req, body);
  }

  // Complaints
  @Post('complaints-add')
  async addComplaint(@Req() req: Request, @Body() body: ComplaintsDto) {
    return await this.complaintsAddService.startComplaintAdd(req, body);
  }
  @Post('complaints-update')
  async updateComplaint(@Req() req: Request, @Body() body: UpdateComplaintsDto) {
    return await this.complaintsAddService.startComplaintUpdate(req, body);
  }

  // Notifications
  @Post('notifications-add')
  async addNotification(@Req() req: Request, @Body() body: NotificationsDto) {
    return await this.notificationsAddService.startNotificationAdd(req, body);
  }
  @Post('maintenance-requests-list')
  async getmaintenancerequestsList(@Req() req: Request, @Body() body: ListDto) {
    return await this.maintenance_requestsService.startMaintenanceRequests(req, body);
  }

  @Post('maintenance-requests-details')
  async getmaintenancerequestsDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.maintenance_requestsService.startMaintenanceRequestDetails(req, body);
  }

  @Post('electricity-readings-list')
  async getelectricityreadingsList(@Req() req: Request, @Body() body: ListDto) {
    return await this.electricity_readingsService.startElectricityReadings(req, body);
  }

  @Post('electricity-readings-details')
  async getelectricityreadingsDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.electricity_readingsService.startElectricityReadingDetails(req, body);
  }

  @Post('visitor-logs-list')
  async getvisitorlogsList(@Req() req: Request, @Body() body: ListDto) {
    return await this.visitor_logsService.startVisitorLogs(req, body);
  }

  @Post('visitor-logs-details')
  async getvisitorlogsDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.visitor_logsService.startVisitorLogDetails(req, body);
  }

  @Post('complaints-list')
  async getcomplaintsList(@Req() req: Request, @Body() body: ListDto) {
    return await this.complaintsService.startComplaints(req, body);
  }

  @Post('complaints-details')
  async getcomplaintsDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.complaintsService.startComplaintDetails(req, body);
  }

  @Post('notifications-list')
  async getnotificationsList(@Req() req: Request, @Body() body: ListDto) {
    return await this.notificationsService.startNotifications(req, body);
  }

  @Post('notifications-details')
  async getnotificationsDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.notificationsService.startNotificationDetails(req, body);
  }

}
