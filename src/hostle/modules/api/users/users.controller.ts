import { Body, Controller, Get, Post, Req, Param, Patch, Query, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(AnyFilesInterceptor())
  async addUser(@Req() req: Request, @Body() body: UsersDto) {
    return await this.usersAddService.startUserAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('users-update/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateUser(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateUsersDto) {
    return await this.usersAddService.startUserUpdate(req, { ...body, id, files: (req as any).files });
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
  @UseInterceptors(AnyFilesInterceptor())
  async addStudent(@Req() req: Request, @Body() body: StudentsDto) {
    return await this.studentsAddService.startStudentAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('students-update/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateStudent(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateStudentsDto) {
    return await this.studentsAddService.startStudentUpdate(req, { ...body, id, files: (req as any).files });
  }

  // Stays
  @Post('stays-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addStay(@Req() req: Request, @Body() body: StaysDto) {
    return await this.staysAddService.startStayAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('stays-update/:id')
  async updateStay(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateStaysDto) {
    return await this.staysAddService.startStayUpdate(req, { ...body, id });
  }
  @Get('users-list')
  async getusersList(@Req() req: Request, @Query() query: ListDto) {
    return await this.usersService.startUsers(req, query);
  }

  @Get('users-details/:id')
  async getusersDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.usersService.startUserDetails(req, { id });
  }

  @Get('students-list')
  async getstudentsList(@Req() req: Request, @Query() query: ListDto) {
    return await this.studentsService.startStudents(req, query);
  }

  @Get('students-details/:id')
  async getstudentsDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.studentsService.startStudentDetails(req, { id });
  }

  @Get('stays-list')
  async getstaysList(@Req() req: Request, @Query() query: ListDto) {
    return await this.staysService.startStays(req, query);
  }

  @Get('stays-details/:id')
  async getstaysDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.staysService.startStayDetails(req, { id });
  }

}
