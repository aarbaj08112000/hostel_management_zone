import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users/services/users.service';
import { UsersAuthService } from './users/services/users.auth.service';
import { StudentsService } from './students/services/students.service';
import { StaysService } from './stays/services/stays.service';
import { UsersDto, UpdateUsersDto, LoginDto, SignupDto } from './users/dto/users.dto';
import { StudentsDto, UpdateStudentsDto } from './students/dto/students.dto';
import { StaysDto, UpdateStaysDto } from './stays/dto/stays.dto';
import { UserAddService } from './users/services/users.add.service';
import { StudentAddService } from './students/services/students.add.service';
import { StaysAddService } from './stays/services/stays.add.service';

import { ListDto } from 'src/hostle/dto/common-list.dto';
import { DetailDto } from 'src/hostle/dto/common-detail.dto';
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
    private readonly staysService: StaysService,
    private readonly usersAddService: UserAddService,
    private readonly studentsAddService: StudentAddService,
    private readonly staysAddService: StaysAddService,
    private readonly usersAuthService: UsersAuthService,
  ) { }

  @Get()
  async sayHello() {
    return 'hello Users';
  }

  // Users
  @Post('users-add')
  async addUser(@Req() req: Request, @Body() body: UsersDto) {
    return await this.usersAddService.startUserAdd(req, body);
  }
  @Post('users-update')
  async updateUser(@Req() req: Request, @Body() body: UpdateUsersDto) {
    return await this.usersAddService.startUserUpdate(req, body);
  }

  @Post('users-login')
  async loginUser(@Req() req: Request, @Body() body: LoginDto) {
    return await this.usersAuthService.login(req, body);
  }

  @Post('users-signup')
  async signupUser(@Req() req: Request, @Body() body: SignupDto) {
    return await this.usersAuthService.signup(req, body);
  }

  // Students
  @Post('students-add')
  async addStudent(@Req() req: Request, @Body() body: StudentsDto) {
    return await this.studentsAddService.startStudentAdd(req, body);
  }
  @Post('students-update')
  async updateStudent(@Req() req: Request, @Body() body: UpdateStudentsDto) {
    return await this.studentsAddService.startStudentUpdate(req, body);
  }

  // Stays
  @Post('stays-add')
  async addStay(@Req() req: Request, @Body() body: StaysDto) {
    return await this.staysAddService.startStayAdd(req, body);
  }
  @Post('stays-update')
  async updateStay(@Req() req: Request, @Body() body: UpdateStaysDto) {
    return await this.staysAddService.startStayUpdate(req, body);
  }
  @Post('users-list')
  async getusersList(@Req() req: Request, @Body() body: ListDto) {
    return await this.usersService.startUsers(req, body);
  }

  @Post('users-details')
  async getusersDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.usersService.startUserDetails(req, body);
  }

  @Post('students-list')
  async getstudentsList(@Req() req: Request, @Body() body: ListDto) {
    return await this.studentsService.startStudents(req, body);
  }

  @Post('students-details')
  async getstudentsDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.studentsService.startStudentDetails(req, body);
  }

  @Post('stays-list')
  async getstaysList(@Req() req: Request, @Body() body: ListDto) {
    return await this.staysService.startStays(req, body);
  }

  @Post('stays-details')
  async getstaysDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.staysService.startStayDetails(req, body);
  }

}
