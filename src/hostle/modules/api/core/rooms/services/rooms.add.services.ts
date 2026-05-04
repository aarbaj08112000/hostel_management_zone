import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { BaseService } from '@repo/source/services/base.service';
import { RoomsEntity } from '../entities/rooms.entity';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class RoomAddService extends BaseService {
  protected readonly log = new LoggerHandler(RoomAddService.name).getInstance();
  protected inputParams: any = {};
  protected singleKeys: any[] = [];
  protected blockResult: any = {};
  protected requestObj: AuthObject = { user: {} };

  @InjectRepository(RoomsEntity) protected roomRepo: Repository<RoomsEntity>;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly commonAttachment: CommonAttachmentService;

  constructor() {
    super();
    this.singleKeys = [
      'custom_unique_condition',
      'insert_room_data',
      'update_room_data',
    ];
    this.moduleName = 'room';
    this.serviceConfig = {
      module_name: 'room',
      table_name: 'rooms',
      table_alias: 'r',
      primary_key: 'roomId',
      primary_alias: 'r_room_id',
      unique_fields: {
        type: 'and',
        fields: { room_number: 'roomNumber', hostel_id: 'hostelId' },
        message: 'Room already exists in this hostel',
      },
      expRefer: {},
      topRefer: {},
    };
  }

  // =================== ADD ROOM ===================
  async startRoomAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('add');

      reqParams = await this.customUniqueCondition(reqParams);

      if (reqParams.unique_status === 1) {
        outputResponse = this.roomUniqueFailure(reqParams);
      } else {
        reqParams = await this.insertRoomData(reqParams);

        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'room';
          reqParams.entity_id = reqParams.insert_room_data.insert_id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams.files,
          );
        }

        outputResponse = !_.isEmpty(reqParams.insert_room_data)
          ? await this.roomFinishSuccess(reqParams, 'Room Added Successfully.')
          : await this.roomFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> room_add >>', err);
    }
    return outputResponse;
  }

  // =================== UPDATE ROOM ===================
  async startRoomUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('update');

      reqParams = await this.customUniqueCondition(reqParams);

      if (reqParams.unique_status === 1) {
        outputResponse = this.roomUniqueFailure(reqParams);
      } else {
        reqParams = await this.updateRoomData(reqParams);

        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'room';
          reqParams.entity_id = reqParams.id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams.files,
          );
        }

        outputResponse = !_.isEmpty(reqParams.update_room_data)
          ? await this.roomFinishSuccess(
              reqParams,
              'Room Updated Successfully.',
            )
          : await this.roomFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> room_update >>', err);
    }
    return outputResponse;
  }

  // =================== INSERT ROOM DATA ===================
  async insertRoomData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('hostel_id' in inputParams)
        queryColumns.hostel_id = inputParams.hostel_id;
      if ('floor_id' in inputParams)
        queryColumns.floor_id = inputParams.floor_id;
      if ('room_number' in inputParams)
        queryColumns.room_number = inputParams.room_number;
      if ('room_type' in inputParams)
        queryColumns.room_type = inputParams.room_type;
      if ('total_beds' in inputParams)
        queryColumns.total_beds = inputParams.total_beds;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('added_by' in inputParams)
        queryColumns.added_by = inputParams.added_by;
      queryColumns.added_date = () => 'NOW()';

      const res = await this.roomRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Room Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.insert_room_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  // =================== UPDATE ROOM DATA ===================
  async updateRoomData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('floor_id' in inputParams)
        queryColumns.floor_id = inputParams.floor_id;
      if ('room_number' in inputParams)
        queryColumns.room_number = inputParams.room_number;
      if ('room_type' in inputParams)
        queryColumns.room_type = inputParams.room_type;
      if ('total_beds' in inputParams)
        queryColumns.total_beds = inputParams.total_beds;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('updated_by' in inputParams)
        queryColumns.updated_by = inputParams.updated_by;
      queryColumns.updated_date = () => 'NOW()';

      const queryObject = this.roomRepo
        .createQueryBuilder()
        .update(RoomsEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('room_id = :id', { id: inputParams.id });

      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Room Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.update_room_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  // =================== UNIQUE CHECK ===================
  async customUniqueCondition(inputParams: any) {
    try {
      const result = await this.checkUniqueCondition(inputParams);
      const formatData = this.response.assignFunctionResponse(result);
      inputParams.custom_unique_condition = formatData;
      inputParams = this.response.assignSingleRecord(inputParams, formatData);
    } catch (err) {
      this.log.error(err);
    }
    return inputParams;
  }

  // =================== SUCCESS / FAILURE ===================
  async roomFinishSuccess(inputParams: any, message: string) {
    const settingFields = {
      status: 200,
      success: 1,
      message,
      fields: ['insert_room_data', 'update_room_data'],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'room_add', single_keys: this.singleKeys },
    );
  }

  async roomFinishFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'room_add' },
    );
  }

  // =================== UNIQUE FAILURE ===================
  roomUniqueFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Room already exists in this hostel'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'room_add' },
    );
  }
}
