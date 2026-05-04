import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { BaseService } from '@repo/source/services/base.service';
import { UsersEntity } from '../entities/users.entity';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { LoginDto, SignupDto } from '../dto/users.dto';

@Injectable()
export class UsersAuthService extends BaseService {
  protected readonly log = new LoggerHandler(UsersAuthService.name).getInstance();

  @InjectRepository(UsersEntity) protected userRepo: Repository<UsersEntity>;
  @Inject() protected readonly response: ResponseLibrary;

  constructor() {
    super();
  }

  async signup(reqObject: any, body: SignupDto) {
    try {
      // Check if email already exists
      const existingUser = await this.userRepo.findOne({ where: { email: body.email } });
      if (existingUser) {
        return this.response.outputResponse(
          { settings: { status: 200, success: 0, message: 'Record already exists with this email', fields: [] }, data: {} },
          { name: 'user_signup' },
        );
      }

      // Hash password
      const salt = bcryptjs.genSaltSync(10);
      const password_hash = bcryptjs.hashSync(body.password, salt);

      // Insert user
      const res = await this.userRepo.insert({
        name: body.name,
        email: body.email,
        password_hash: password_hash,
        role: body.role || 'user',
        status: 'Active',
        added_date: new Date(),
      });

      return this.response.outputResponse(
        {
          settings: { status: 200, success: 1, message: 'Signup Successful.', fields: [] },
          data: { insert_id: res.raw.insertId }
        },
        { name: 'user_signup' },
      );

    } catch (err) {
      this.log.error('API Error >> signup >>', err);
      return this.response.outputResponse(
        { settings: { status: 500, success: 0, message: 'Internal Server Error', fields: [] }, data: {} },
        { name: 'user_signup' },
      );
    }
  }

  async login(reqObject: any, body: LoginDto) {
    try {
      const user = await this.userRepo.findOne({ where: { email: body.email } });

      if (!user) {
        return this.response.outputResponse(
          { settings: { status: 200, success: 0, message: 'Invalid credentials', fields: [] }, data: {} },
          { name: 'user_login' },
        );
      }
      console.log(body)
      console.log(user)
      const isMatched = bcryptjs.compareSync(body.password, user.password_hash || '');
      if (!isMatched) {
        return this.response.outputResponse(
          { settings: { status: 200, success: 0, message: 'Invalid credentials', fields: [] }, data: {} },
          { name: 'user_login' },
        );
      }

      if (user.status !== 'Active') {
        return this.response.outputResponse(
          { settings: { status: 200, success: 0, message: 'Account is inactive', fields: [] }, data: {} },
          { name: 'user_login' },
        );
      }

      // generate token
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email, role: user.role },
        process.env.DATA_SECRET || 'secretKey',
        { expiresIn: '30d' } // Extended expiry for mobile apps
      );

      // Avoid sending password back
      delete user.password_hash;

      const inputParams = body as any;
      inputParams.user_data = user;
      inputParams.token = token;

      return this.loginFinishedSuccess(inputParams);

    } catch (err) {
      this.log.error('API Error >> login >>', err);
      return this.response.outputResponse(
        { settings: { status: 500, success: 0, message: 'Internal Server Error', fields: [] }, data: {} },
        { name: 'user_login' },
      );
    }
  }

  loginFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: 'Login Successful.',
      fields: [
        'user_id',
        'name',
        'email',
        'role',
        'status',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
        'token'
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'user_login',
      multiple_keys: ['user_data', 'token'],
      output_keys: ['user_data', 'token'],
    };

    return this.response.outputResponse(outputData, funcData);
  }
}
