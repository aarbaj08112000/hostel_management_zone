import { Body, Controller, Get, Post, Req } from '@nestjs/common';
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
  async getHostleList(@Req() req: Request, @Body() body: ListDto) {
    const params = body;
    return await this.hostelsService.startHostels(req, params);
  }
  @Post('floors-list')
  async getFloorList(@Req() req: Request, @Body() body: ListDto) {
    const params = body;
    return await this.floorsService.startFloors(req, params);
  }
  @Post('rooms-list')
  async getRoomList(@Req() req: Request, @Body() body: ListDto) {
    const params = body;
    return await this.roomsService.startRooms(req, params);
  }
  @Post('beds-list')
  async getBedList(@Req() req: Request, @Body() body: ListDto) {
    const params = body;
    return await this.bedsService.startBeds(req, params);
  }
  @Post('hostle-details')
  async getHostleDetails(@Req() req: Request, @Body() body: DetailDto) {
    const params = body;
    return await this.hostelsService.startHostelDetails(req, params);
  }
  @Post('floors-details')
  async getFloorDetails(@Req() req: Request, @Body() body: DetailDto) {
    const params = body;
    return await this.floorsService.startFloorDetails(req, params);
  }
  @Post('rooms-details')
  async getRoomDetails(@Req() req: Request, @Body() body: DetailDto) {
    const params = body;
    return await this.roomsService.startRoomDetails(req, params);
  }
  @Post('beds-details')
  async getBedDetails(@Req() req: Request, @Body() body: DetailDto) {
    const params = body;
    return await this.bedsService.startBedDetails(req, params);
  }
  @Post('amenities-list')
  async getAmenitiesList(@Req() req: Request, @Body() body: ListDto) {
    const params = body;
    return await this.amenitiesService.startAmenities(req, params);
  }
  @Post('hostle-amenities-list')
  async getHostleAmenitiesList(@Req() req: Request, @Body() body: ListDto) {
    const params = body;
    return await this.hostel_amenitiesService.startHostelAmenities(req, params);
  }
  @Post('food-plan-list')
  async getFoodPlan(@Req() req: Request, @Body() body: ListDto) {
    const params = body;
    return await this.food_plansService.startFoodPlans(req, params);
  }
  @Post('student-food-plan-list')
  async getStudentFoodPlan(@Req() req: Request, @Body() body: ListDto) {
    const params = body;
    return await this.student_food_plansService.startStudentFoodPlans(
      req,
      params,
    );
  }
  @Post('amenities-details')
  async getAmenitiesDetails(@Req() req: Request, @Body() body: DetailDto) {
    const params = body;
    return await this.amenitiesService.startAmenitieDetails(req, params);
  }
  @Post('hostle-amenities-details')
  async getHostleAmenitiesDetails(@Req() req: Request, @Body() body: DetailDto) {
    const params = body;
    return await this.hostel_amenitiesService.startHostelAmenitieDetails(req, params);
  }
  @Post('food-plan-details')
  async getFoodPlanDetails(@Req() req: Request, @Body() body: DetailDto) {
    const params = body;
    return await this.food_plansService.startFoodPlanDetails(req, params);
  }
  @Post('student-food-plan-details')
  async getStudentFoodPlanDetails(@Req() req: Request, @Body() body: DetailDto) {
    const params = body;
    return await this.student_food_plansService.startStudentFoodPlanDetails(req, params);
  }

  // Hostel
  @Post('hostle-add')
  async addHostle(@Req() req: Request, @Body() body: HostelsDto) {
    return await this.hostelsAddService.startHostelAdd(req, body);
  }
  @Post('hostle-update')
  async updateHostle(@Req() req: Request, @Body() body: UpdateHostelsDto) {
    return await this.hostelsAddService.startHostelUpdate(req, body);
  }

  // Floors
  @Post('floors-add')
  async addFloor(@Req() req: Request, @Body() body: FloorsDto) {
    return await this.floorsAddService.startFloorAdd(req, body);
  }
  @Post('floors-update')
  async updateFloor(@Req() req: Request, @Body() body: UpdateFloorsDto) {
    return await this.floorsAddService.startFloorUpdate(req, body);
  }

  // Rooms
  @Post('rooms-add')
  async addRoom(@Req() req: Request, @Body() body: RoomsDto) {
    return await this.roomsAddService.startRoomAdd(req, body);
  }
  @Post('rooms-update')
  async updateRoom(@Req() req: Request, @Body() body: UpdateRoomsDto) {
    return await this.roomsAddService.startRoomUpdate(req, body);
  }

  // Beds
  @Post('beds-add')
  async addBed(@Req() req: Request, @Body() body: BedsDto) {
    return await this.bedsAddService.startBedAdd(req, body);
  }
  @Post('beds-update')
  async updateBed(@Req() req: Request, @Body() body: UpdateBedsDto) {
    return await this.bedsAddService.startBedUpdate(req, body);
  }

  // Amenities
  @Post('amenities-add')
  async addAmenities(@Req() req: Request, @Body() body: AmenitiesDto) {
    return await this.amenitiesAddService.startAmenityAdd(req, body);
  }
  @Post('amenities-update')
  async updateAmenities(@Req() req: Request, @Body() body: UpdateAmenitiesDto) {
    return await this.amenitiesAddService.startAmenityUpdate(req, body);
  }

  // Hostel Amenities
  @Post('hostle-amenities-add')
  async addHostleAmenities(@Req() req: Request, @Body() body: HostelAmenitiesDto) {
    return await this.hostel_amenitiesAddService.startHostelAmenityAdd(req, body);
  }
  @Post('hostle-amenities-update')
  async updateHostleAmenities(@Req() req: Request, @Body() body: UpdateHostelAmenitiesDto) {
    return await this.hostel_amenitiesAddService.startHostelAmenityUpdate(req, body);
  }

  // Food Plans
  @Post('food-plan-add')
  async addFoodPlan(@Req() req: Request, @Body() body: FoodPlansDto) {
    return await this.food_plansAddService.startFoodPlanAdd(req, body);
  }
  @Post('food-plan-update')
  async updateFoodPlan(@Req() req: Request, @Body() body: UpdateFoodPlansDto) {
    return await this.food_plansAddService.startFoodPlanUpdate(req, body);
  }

  // Student Food Plans
  @Post('student-food-plan-add')
  async addStudentFoodPlan(@Req() req: Request, @Body() body: StudentFoodPlansDto) {
    return await this.student_food_plansAddService.startPlanAdd(req, body);
  }
  @Post('student-food-plan-update')
  async updateStudentFoodPlan(@Req() req: Request, @Body() body: UpdateStudentFoodPlansDto) {
    return await this.student_food_plansAddService.startPlanUpdate(req, body);
  }
}
