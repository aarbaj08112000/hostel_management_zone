import { Body, Controller, Get, Post, Req, Param, Patch, Delete, Query, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { HostelsService } from './hostels/services/hostels.service';
import { HostelAddService } from './hostels/services/hostels.add.service';
import { FloorsService } from './floors/services/floors.service';
import { FloorsAddService } from './floors/services/floors.add.service';
import { RoomsService } from './rooms/services/rooms.service';
import { RoomAddService } from './rooms/services/rooms.add.services';
import { BedsService } from './beds/services/beds.service';
import { BedsAddService } from './beds/services/beds.add.service';
import { AmenitiesService } from './amenities/services/amenities.service';
import { AmenitiesAddService } from './amenities/services/amenties.add.service';
import { HostelAmenitiesService } from './hostel_amenities/services/hostel_amenities.service';
import { HostelAmenitiesAddService } from './hostel_amenities/services/hostle_amenities.add.service';
import { FoodPlansService } from './food_plans/services/food_plans.service';
import { FoodPlansAddService } from './food_plans/services/food_plan.add.service';
import { StudentFoodPlansService } from './student_food_plans/services/student_food_plans.service';
import { StudentFoodPlansAddService } from './student_food_plans/services/student_food_plans.add.service';
import { HostelsDto, UpdateHostelsDto } from './hostels/dto/hostels.dto';
import { FloorsDto, UpdateFloorsDto } from './floors/dto/floors.dto';
import { RoomsDto, UpdateRoomsDto } from './rooms/dto/rooms.dto';
import { BedsDto, UpdateBedsDto } from './beds/dto/beds.dto';
import {
  AmenitiesDto,
  UpdateAmenitiesDto,
} from './amenities/dto/amenities.dto';
import {
  HostelAmenitiesDto,
  UpdateHostelAmenitiesDto,
} from './hostel_amenities/dto/hostel_amenities.dto';
import {
  FoodPlansDto,
  UpdateFoodPlansDto,
} from './food_plans/dto/food_plans.dto';
import {
  StudentFoodPlansDto,
  UpdateStudentFoodPlansDto,
} from './student_food_plans/dto/student_food_plans.dto';
import { ListDto } from 'src/hostle/dto/common-list.dto';
import { DetailDto } from 'src/hostle/dto/common-detail.dto';
@Controller('core')
export class CoreController {
  constructor(
    private readonly hostelsService: HostelsService,
    private readonly floorsService: FloorsService,
    private readonly roomsService: RoomsService,
    private readonly bedsService: BedsService,
    private readonly amenitiesService: AmenitiesService,
    private readonly hostel_amenitiesService: HostelAmenitiesService,
    private readonly food_plansService: FoodPlansService,
    private readonly student_food_plansService: StudentFoodPlansService,
    private readonly hostelsAddService: HostelAddService,
    private readonly floorsAddService: FloorsAddService,
    private readonly roomsAddService: RoomAddService,
    private readonly bedsAddService: BedsAddService,
    private readonly amenitiesAddService: AmenitiesAddService,
    private readonly hostel_amenitiesAddService: HostelAmenitiesAddService,
    private readonly food_plansAddService: FoodPlansAddService,
    private readonly student_food_plansAddService: StudentFoodPlansAddService,
  ) { }

  @Get()
  async sayHello() {
    return 'hello Core';
  }
  @Post('hostle-list')
  async getHostleList(@Req() req: Request, @Query() query: ListDto) {
    return await this.hostelsService.startHostels(req, query);
  }
  @Get('floors-list')
  async getFloorList(@Req() req: Request, @Query() query: ListDto) {
    return await this.floorsService.startFloors(req, query);
  }
  @Get('rooms-list')
  async getRoomList(@Req() req: Request, @Query() query: ListDto) {
    return await this.roomsService.startRooms(req, query);
  }
  @Get('beds-list')
  async getBedList(@Req() req: Request, @Query() query: ListDto) {
    return await this.bedsService.startBeds(req, query);
  }
  @Get('hostle-details/:id')
  async getHostleDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.hostelsService.startHostelDetails(req, { id });
  }
  @Get('floors-details/:id')
  async getFloorDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.floorsService.startFloorDetails(req, { id });
  }
  @Get('rooms-details/:id')
  async getRoomDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.roomsService.startRoomDetails(req, { id });
  }
  @Get('beds-details/:id')
  async getBedDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.bedsService.startBedDetails(req, { id });
  }
  @Get('amenities-list')
  async getAmenitiesList(@Req() req: Request, @Query() query: ListDto) {
    return await this.amenitiesService.startAmenities(req, query);
  }
  @Get('hostle-amenities-list')
  async getHostleAmenitiesList(@Req() req: Request, @Query() query: ListDto) {
    return await this.hostel_amenitiesService.startHostelAmenities(req, query);
  }
  @Get('food-plan-list')
  async getFoodPlan(@Req() req: Request, @Query() query: ListDto) {
    return await this.food_plansService.startFoodPlans(req, query);
  }
  @Get('student-food-plan-list')
  async getStudentFoodPlan(@Req() req: Request, @Query() query: ListDto) {
    return await this.student_food_plansService.startStudentFoodPlans(req, query);
  }
  @Get('amenities-details/:id')
  async getAmenitiesDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.amenitiesService.startAmenitieDetails(req, { id });
  }
  @Get('hostle-amenities-details/:id')
  async getHostleAmenitiesDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.hostel_amenitiesService.startHostelAmenitieDetails(req, { id });
  }
  @Get('food-plan-details/:id')
  async getFoodPlanDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.food_plansService.startFoodPlanDetails(req, { id });
  }
  @Get('student-food-plan-details/:id')
  async getStudentFoodPlanDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.student_food_plansService.startStudentFoodPlanDetails(req, { id });
  }

  // Hostel
  @Post('hostle-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addHostle(@Req() req: Request, @Body() body: HostelsDto) {
    return await this.hostelsAddService.startHostelAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('hostle-update/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateHostle(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateHostelsDto) {
    return await this.hostelsAddService.startHostelUpdate(req, { ...body, id, files: (req as any).files });
  }
  @Delete('hostle-attachment-delete/:attachment_id')
  async deleteAttachment(@Param('attachment_id') attachment_id: string) {
    return await this.hostelsAddService.deleteAttachment(Number(attachment_id));
  }

  // Floors
  @Post('floors-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addFloor(@Req() req: Request, @Body() body: FloorsDto) {
    return await this.floorsAddService.startFloorAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('floors-update/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateFloor(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateFloorsDto) {
    return await this.floorsAddService.startFloorUpdate(req, { ...body, id, files: (req as any).files });
  }

  // Rooms
  @Post('rooms-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addRoom(@Req() req: Request, @Body() body: RoomsDto) {
    return await this.roomsAddService.startRoomAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('rooms-update/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateRoom(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateRoomsDto) {
    return await this.roomsAddService.startRoomUpdate(req, { ...body, id, files: (req as any).files });
  }
  @Delete('rooms-delete/:id')
  async deleteRoom(@Param('id') id: string) {
    return await this.roomsAddService.DeleteRoom(Number(id));
  }

  // Beds
  @Post('beds-add')
  async addBed(@Req() req: Request, @Body() body: BedsDto) {
    return await this.bedsAddService.startBedAdd(req, body);
  }
  @Patch('beds-update/:id')
  async updateBed(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateBedsDto) {
    return await this.bedsAddService.startBedUpdate(req, { ...body, id });
  }

  // Amenities
  @Post('amenities-add')
  async addAmenities(@Req() req: Request, @Body() body: AmenitiesDto) {
    return await this.amenitiesAddService.startAmenityAdd(req, body);
  }
  @Patch('amenities-update/:id')
  async updateAmenities(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateAmenitiesDto) {
    return await this.amenitiesAddService.startAmenityUpdate(req, { ...body, id });
  }
  @Delete('amenities-delete/:id')
  async deleteAmenities(@Param('id') id: string) {
    return await this.amenitiesAddService.DeleteAmenity(Number(id));
  }

  // Hostel Amenities
  @Post('hostle-amenities-add')
  async addHostleAmenities(@Req() req: Request, @Body() body: HostelAmenitiesDto) {
    return await this.hostel_amenitiesAddService.startHostelAmenityAdd(req, body);
  }
  @Patch('hostle-amenities-update/:id')
  async updateHostleAmenities(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateHostelAmenitiesDto) {
    return await this.hostel_amenitiesAddService.startHostelAmenityUpdate(req, { ...body, id });
  }

  // Food Plans
  @Post('food-plan-add')
  async addFoodPlan(@Req() req: Request, @Body() body: FoodPlansDto) {
    return await this.food_plansAddService.startFoodPlanAdd(req, body);
  }
  @Patch('food-plan-update/:id')
  async updateFoodPlan(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateFoodPlansDto) {
    return await this.food_plansAddService.startFoodPlanUpdate(req, { ...body, id });
  }
  @Delete('food-plan-delete/:id')
  async deleteFoodPlan(@Param('id') id: string) {
    return await this.food_plansAddService.DeleteFoodPlan(Number(id));
  }

  // Student Food Plans
  @Post('student-food-plan-add')
  async addStudentFoodPlan(@Req() req: Request, @Body() body: StudentFoodPlansDto) {
    return await this.student_food_plansAddService.startPlanAdd(req, body);
  }
  @Patch('student-food-plan-update/:id')
  async updateStudentFoodPlan(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateStudentFoodPlansDto) {
    return await this.student_food_plansAddService.startPlanUpdate(req, { ...body, id });
  }
  @Delete('student-food-plan-delete/:id')
  async deleteStudentFoodPlan(@Param('id') id: string) {
    return await this.student_food_plansAddService.DeletePlan(Number(id));
  }
}
