interface AuthObject {
  user: any;
}
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto } from '@repo/source/common/dto/common.dto';
import { SettingsParamsDto } from '@repo/source/common/dto/common.dto';
import { DataSource, Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { BodyEntity } from '../entities/body.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';
@Injectable()
export class BodyAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    BodyAddService.name,
  ).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected singleKeys: any[] = [];
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
  @InjectRepository(BodyEntity)
  protected bodyEntityRepo: Repository<BodyEntity>;

  /**
   * constructor method is used to set preferences while service object initialization.
   */
  constructor() {
    super()
    this.singleKeys = ['custom_unique_condition', 'insert_body_data', 'update_body_data'];
    this.moduleName = 'body';
    this.moduleAPI = '';
    this.serviceConfig = {
      module_name: 'body',
      table_name: 'body_type',
      table_alias: 'b',
      primary_key: 'bodyTypeid',
      primary_alias: 'b_body_type_id',
      unique_fields: {
        type: 'and',
        fields: {
          body_code: 'bodyCode',
        },
        message: 'Record already exists with this Body Code',
      },
      expRefer: {},
      topRefer: {},
    };
  }

  async startBodyUpdate(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');
      let inputParams = reqParams;

      inputParams = await this.customUniqueCondition(inputParams);
      if (inputParams.unique_status === 1) {
        outputResponse = this.bodyUniqueFailure(inputParams);
      } else {
        inputParams = await this.updateBodyData(inputParams);
        if (!_.isEmpty(inputParams.update_body_data)) {
          outputResponse = this.bodyFinishSuccess(inputParams, 'Body Updated successfully.');
        } else {
          outputResponse = this.bodyFinishFailure(inputParams);
        }
      }
    } catch (err) {
      this.log.error('API Error >> body_update >>', err);
    }
    return outputResponse;
  }
  async updateBodyData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('body_type' in inputParams) {
        queryColumns.bodyType = inputParams.body_type;
      }

      if ('updated_by' in inputParams) {
        queryColumns.updatedBy = inputParams.updated_by;
      }

      queryColumns.updatedDate = () => 'NOW()';

      if ('status' in inputParams) {
        queryColumns.status = inputParams.status;
      }
      const queryObject = this.bodyEntityRepo
        .createQueryBuilder()
        .update(BodyEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id)) {
        queryObject.andWhere('bodyTypeId = :id', { id: inputParams.id });
      }
      const res = await queryObject.execute();
      const data = {
        affected_rows: res.affected,
      };

      const success = 1;
      const message = 'Record(s) updated.';

      const queryResult = {
        success,
        message,
        data,
      };
      this.blockResult = queryResult;
    } catch (err) {
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.update_body_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }
  async startBodyAdd(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      let inputParams = reqParams;

      inputParams = await this.customUniqueCondition(inputParams);
      if (inputParams.unique_status === 1) {
        outputResponse = this.bodyUniqueFailure(inputParams);
      } else {
        inputParams = await this.insertBodyData(inputParams);
        if (!_.isEmpty(inputParams.insert_body_data)) {
          outputResponse = this.bodyFinishSuccess(inputParams, 'Body Added successfully.');
        } else {
          outputResponse = this.bodyFinishFailure(inputParams);
        }
      }
    } catch (err) {
      this.log.error('API Error >> body_add >>', err);
    }
    return outputResponse;
  }

  async customUniqueCondition(inputParams: any) {
    let formatData: any = {};
    try {
      //@ts-ignore
      const result = await this.checkUniqueCondition(inputParams);

      formatData = this.response.assignFunctionResponse(result);
      inputParams.custom_unique_condition = formatData;

      inputParams = this.response.assignSingleRecord(inputParams, formatData);
    } catch (err) {
      this.log.error(err);
    }
    return inputParams;
  }
  async DeleteBody(id) {
    let outputResponse = {};

    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteBodyData(id);

      if (inputParams.deleted_body) {
        let job_data = {
          job_function: 'delete_elastic_data',
          job_params: {
            module: 'nest_local_body',
            data: id
          },
          path: 'api/master/delete-data'
        };
        await this.general.submitGearmanJob(job_data);
        outputResponse = this.bodyFinishSuccess(inputParams, inputParams.message);
      } else {
        outputResponse = this.bodyFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> body_delete >>', err);
    }
    return outputResponse;
  }

  async deleteBodyData(id: any) {
    try {
      let bodyTypeId = id;
      const deleteResult = await this.bodyEntityRepo.delete({ bodyTypeId });

      if (deleteResult.affected === 0) {
        return { success: 0, message: 'No Body found.' };
      }

      return {
        success: 1,
        message: 'Body Deleted Successfully.',
        deleted_body: deleteResult.affected
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }
  bodyUniqueFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Record already exists with this Body Code'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'body_add',
      },
    );
  }

  async insertBodyData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('body_type' in inputParams) {
        queryColumns.bodyType = inputParams.body_type;
      }
      if ('body_code' in inputParams) {
        queryColumns.bodyCode = inputParams.body_code;
      }
      if ('status' in inputParams) {
        queryColumns.status = inputParams.status;
      }
      if ('added_by' in inputParams) {
        queryColumns.addedBy = inputParams.added_by;
      }
      queryColumns.addedDate = () => 'NOW()';
      const queryObject = this.bodyEntityRepo;
      const res = await queryObject.insert(queryColumns);
      const data = {
        insert_id: res.raw.insertId,
      };

      const success = 1;
      const message = 'Body Added Successfully.';

      const queryResult = {
        success,
        message,
        data,
      };
      this.blockResult = queryResult;
    } catch (err) {
      console.log(err);
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.insert_body_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }

  async bodyFinishSuccess(inputParams: any, message: string) {
    const settingFields = {
      status: 200,
      success: 1,
      message: message,
      fields: [],
    };
    settingFields.fields = ['insert_id', 'insert_body_data'];

    const outputKeys = ['insert_body_data'];
    const outputAliases = {
      insert_id: 'id',
    };
    const outputObjects = ['insert_body_data'];

    const outputData: any = {};
    outputData.settings = settingFields;
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'body_add';

    funcData.output_keys = outputKeys;
    funcData.output_alias = outputAliases;
    funcData.output_objects = outputObjects;
    funcData.single_keys = this.singleKeys;
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'body_list',
        data: inputParams.insert_id ? inputParams.insert_id : inputParams.id
      },
    };
    await this.general.submitGearmanJob(job_data)
    return this.response.outputResponse(outputData, funcData);
  }

  bodyFinishFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'body_add',
      },
    );
  }
}
