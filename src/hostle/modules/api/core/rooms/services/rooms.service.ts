import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import {
  BlockResultDto,
  SettingsParamsDto,
} from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { RoomsEntity } from '../entities/rooms.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class RoomsService {
  protected readonly log = new LoggerHandler(RoomsService.name).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected multipleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;

  constructor(protected readonly elasticService: ElasticService) { }

  async startRooms(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getRooms(this.inputParams);
      if (!_.isEmpty(this.inputParams.rooms)) {
        outputResponse = this.roomsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.roomsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> rooms >>', err);
    }
    return outputResponse;
  }

  async getRooms(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(RoomsEntity)
        .createQueryBuilder('r')
        .leftJoin('hostels', 'h', 'h.hostel_id = r.hostel_id')
        .leftJoin('floors', 'f', 'f.floor_id = r.floor_id')
        .select('r.*')
        .addSelect('h.hostel_name', 'hostel_name')
        .addSelect('f.floor_number', 'floor_number');

      if ('hostel_id' in inputParams) {
        query.where('r.hostel_id = :hid', { hid: inputParams.hostel_id });
      }

      if ('floor_id' in inputParams) {
        query.andWhere('r.floor_id = :fid', { fid: inputParams.floor_id });
      }


      const count = await query.getCount();
      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);
      const data = await query.getRawMany();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Records found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.rooms = this.blockResult.data;
    
    return inputParams;
  }

  roomsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Rooms found.'),
      fields: [
        'room_id',
        'hostel_id',
        'hostel_name',
        'floor_id',
        'floor_number',
        'room_number',
        'room_type',
        'total_beds',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
      page,
      limit,
      total_count,
      total_pages,
      next_page,
      prev_page,
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'rooms',
      multiple_keys: this.multipleKeys,
      output_keys: ['rooms'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startRoomDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getRoomDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.room_details)) {
        outputResponse = this.roomDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.roomsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> room_details >>', err);
    }
    return outputResponse;
  }

  async getRoomDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(RoomsEntity)
        .createQueryBuilder('r')
        .leftJoin('hostels', 'h', 'h.hostel_id = r.hostel_id')
        .leftJoin('floors', 'f', 'f.floor_id = r.floor_id')
        .select('r.*')
        .addSelect('h.hostel_name', 'hostel_name')
        .addSelect('f.floor_number', 'floor_number');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('r.room_id = :rid', { rid: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getRawOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.room_details = this.blockResult.data;
    
    return inputParams;
  }

  roomDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Room details found.'),
      fields: [
        'room_id',
        'hostel_id',
        'hostel_name',
        'floor_id',
        'floor_number',
        'room_number',
        'room_type',
        'total_beds',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'room_details',
      single_keys: ['room_details'],
      output_keys: ['room_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  roomsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Rooms not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'rooms' },
    );
  }
}
