
interface AuthObject {
  user: any;
}
import { Inject, Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto, SettingsParamsDto } from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { stringify } from 'querystring';
@Injectable()
export class LocationtimeSlotService {
  protected readonly log = new LoggerHandler(
    LocationtimeSlotService.name,
  ).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected multipleKeys: any[] = [];
  protected requestObj: AuthObject = {
    user: {},
  };
  @InjectDataSource()
  protected dataSource: DataSource;
  @Inject()
  protected readonly general: CitGeneralLibrary;
  @Inject()
  protected readonly response: ResponseLibrary;
  @Inject()
  protected readonly moduleService: ModuleService;
  constructor(protected readonly elasticService: ElasticService) { }
  async startLocationtimeSlot(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;

      inputParams = await this.getLocationtimeSlot(inputParams);
      if (!_.isEmpty(inputParams.location_timeSlot)) {
        outputResponse = this.locationtimeSlotFinishedSuccess(inputParams);
      } else {
        outputResponse = this.locationtimeSlotFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> location_timeSlot >>', err);
    }
    return outputResponse;
  }
  async getLocationtimeSlot(inputParams: any) {
    this.blockResult = {};
    try {
      let index = 'nest_local_test_drive_list';
      // inputParams.filters = { ...inputParams.filters, car_id: inputParams.carId, slot_date: inputParams.requested_date + 'T00:00:00.000Z' };
      inputParams.filters = [
        { "key": "car_id", "value": inputParams.carId, "operator": "equal" },
        { "key": "slot_date", "value": inputParams.requested_date + 'T00:00:00.000Z', "operator": "equal" },
        { "key": "status", "value": "Cancelled", "operator": "notequal" }
      ];
      let search_params = this.general.createElasticSearchQuery(inputParams);
      let pageIndex = 1;
      if ('page' in inputParams) {
        pageIndex = Number(inputParams.page);
      } else if ('page_index' in inputParams) {
        pageIndex = Number(inputParams.page_index);
      }
      pageIndex = pageIndex > 0 ? pageIndex : 1;
      const recLimit = Number(inputParams.limit);
      const startIdx = custom.getStartIndex(pageIndex, recLimit);
      const results = await this.elasticService.search(
        index,
        search_params,
        startIdx,
        recLimit,
      );
      let operating_hours = inputParams?.operating_hours;
      operating_hours = '';
      let timeSlot = await this.general.getConfigItem('TIME_SLOT');
      let timeZone = await this.general.getConfigItem('TIME_ZONE');
      timeZone = JSON.parse(timeZone);
      let {zone,numeric} = timeZone
      const now = new Date();
      const modifiedZone = new Date (now.toLocaleString("en-US", { timeZone: zone }));
      let location_open = `${inputParams.requested_date} 08:00:00`;
      let location_close = `${inputParams.requested_date} 20:00:00`;
      if (typeof operating_hours != 'undefined' && operating_hours != '' && operating_hours != null) {
        let temp = operating_hours.split('-');
        if (temp.length == 2) {
          location_open = `${inputParams.requested_date} ${temp[0]}`;
          location_close = `${inputParams.requested_date} ${temp[1]}`;
        }
      }
      if (!_.isObject(results) || _.isEmpty(results)) {
        throw new Error('No records found.');
      }
      const totalCount = results['total']['value'];
      if (totalCount <= 0) {
        const success = 1;
        const message = 'No records found. Only available time slots are fetched.';
        let getTimeSlot = this.general.createTimeSlots(location_open, location_close, parseInt(timeSlot));
        const slotDate = location_open.split(' ')[0];
        const now = new Date();
        const updatedTimeSlots = getTimeSlot.map(slot => {
          const [start, end] = slot.slot_time.split(' - ');
          const endTime = new Date(`${slotDate}T${end}`);
          const timeDiffInMinutes = (endTime.getTime() - modifiedZone.getTime()) / (1000 * 60);
          let status = "available";
          if (modifiedZone > endTime ||  timeDiffInMinutes < timeSlot) {
            status = "not_available";
          }

          return {
            ...slot,
            status
          };
        });


        const queryResult = {
          success,
          message,
          data: updatedTimeSlots,
        };

        this.blockResult = queryResult;
        inputParams.location_timeSlot = this.blockResult.data;
        return inputParams;

      }
      let data = results.hits.map((hit) => {
        return hit._source;
      });
      let temp: any = data;
      if (_.isObject(data) && data.length > 0) {
        const success = 1;
        const message = 'Records found.';

        const slotDate = location_open.split(' ')[0];
        const now = new Date();

        let getTimeSlot = this.general.createTimeSlots(location_open, location_close, parseInt(timeSlot));
        const bookedTimes = temp.map(booking => booking.slot_time);

        const updatedTimeSlots = getTimeSlot.map(slot => {
          const [start, end] = slot.slot_time.split(' - ');
          const endTime = new Date(`${slotDate}T${end}`);
          const isBooked = bookedTimes.includes(slot.slot_time);
          const timeDiffInMinutes = (endTime.getTime() - modifiedZone.getTime()) / (1000 * 60);
          const isPast = modifiedZone > endTime || timeDiffInMinutes < timeSlot;

          return {
            ...slot,
            status: isBooked || isPast ? "not_available" : "available"
          };
        });

        data = updatedTimeSlots;

        const queryResult = {
          success,
          message,
          data,
        };

        this.blockResult = queryResult;
      }
      else {
        throw new Error('No records found.');
      }
    } catch (err) {
      console.log(err)
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.location_timeSlot = this.blockResult.data;
    return inputParams;
  }
  locationtimeSlotFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('location timeSlot list found.'),
      fields: [],
    };
    const outputKeys = ['location_timeSlot'];
    settingFields.fields = ['car_id', 'slot_date', 'slot_time', 'customer_id', 'displayTime', 'status'];
    const outputData: any = {};
    outputData.settings = { ...settingFields, ...this.settingsParams };
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'location_timeSlot';

    funcData.output_keys = outputKeys;
    funcData.multiple_keys = this.multipleKeys;
    return this.response.outputResponse(outputData, funcData);
  }
  locationtimeSlotFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('location timeSlot list not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'location_timeSlot',
      },
    );
  }
}
