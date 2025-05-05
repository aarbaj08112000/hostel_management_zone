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
import { ModelEntity } from '../entities/model.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';
@Injectable()
export class ModelAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    ModelAddService.name,
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
  @InjectRepository(ModelEntity)
  protected modelEntityRepo: Repository<ModelEntity>;

  /**
   * constructor method is used to set preferences while service object initialization.
   */
  constructor() {
    super()
    this.singleKeys = ['custom_unique_condition', 'insert_model_data', 'update_model_data'];
    this.moduleName = 'model';
    this.moduleAPI = '';
    this.serviceConfig = {
      module_name: 'model',
      table_name: 'car_model',
      table_alias: 'm',
      primary_key: 'carModelId',
      primary_alias: 'm_model_id',
      unique_fields: {
        type: 'and',
        fields: {
          model_code: 'modelCode',
        },
        message: 'Record already exists with this Model Code',
      },
      expRefer: {},
      topRefer: {},
    };
  }

  async startModelUpdate(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');
      let inputParams = reqParams;

      inputParams = await this.customUniqueCondition(inputParams);
      if (inputParams.unique_status === 1) {
        outputResponse = this.modelUniqueFailure(inputParams);
      } else {
        inputParams = await this.updateModelData(inputParams);
        if (!_.isEmpty(inputParams.update_model_data)) {
          outputResponse = this.modelFinishSuccess(inputParams, 'Model Updated successfully.');
        } else {
          outputResponse = this.modelFinishFailure(inputParams);
        }
      }
    } catch (err) {
      this.log.error('API Error >> model_update >>', err);
    }
    return outputResponse;
  }
  async updateModelData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('model_name' in inputParams) {
        queryColumns.modelName = inputParams.model_name;
      }
      if ('parent_model' in inputParams) {
        queryColumns.parentModelId = inputParams.parent_model;
      }
      if ('status' in inputParams) {
        queryColumns.status = inputParams.status;
      }
      if ('updated_by' in inputParams) {
        queryColumns.updatedBy = inputParams.updated_by;
      }
      if ('brand_id' in inputParams) {
        queryColumns.brandId = inputParams.brand_id;
      }
      queryColumns.updatedDate = () => 'NOW()';
      const queryObject = this.modelEntityRepo
        .createQueryBuilder()
        .update(ModelEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id)) {
        queryObject.andWhere('carModelId = :id', { id: inputParams.id });
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
    inputParams.update_model_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }
  async startModelAdd(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      let inputParams = reqParams;

      inputParams = await this.customUniqueCondition(inputParams);
      if (inputParams.unique_status === 1) {
        outputResponse = this.modelUniqueFailure(inputParams);
      } else {
        inputParams = await this.insertModelData(inputParams);
        if (!_.isEmpty(inputParams.insert_model_data)) {
          outputResponse = this.modelFinishSuccess(inputParams, 'Model Added successfully.');
        } else {
          outputResponse = this.modelFinishFailure(inputParams);
        }
      }
    } catch (err) {
      this.log.error('API Error >> model_add >>', err);
    }
    return outputResponse;
  }
  async DeleteModel(id) {
    let outputResponse = {};

    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteModelData(id);
      if (inputParams.deleted_model) {
        let job_data = {
          job_function: 'delete_elastic_data',
          job_params: {
            module: 'nest_local_model',
            data: id
          },
          path: 'api/master/delete-data'
        };
        await this.general.submitGearmanJob(job_data);
        outputResponse = this.modelFinishSuccess(inputParams, inputParams.message);
      } else {
        outputResponse = this.modelFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> model_delete >>', err);
    }
    return outputResponse;
  }

  async deleteModelData(id: any) {
    try {
      let carModelId = id;
      const deleteResult = await this.modelEntityRepo.delete({ carModelId });

      if (deleteResult.affected === 0) {
        return { success: 0, message: 'No Model found.' };
      }

      return {
        success: 1,
        message: 'Model Deleted Successfully.',
        deleted_model: deleteResult.affected
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
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

  modelUniqueFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Record already exists with this Model Code'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'model_add',
      },
    );
  }

  async insertModelData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('model_name' in inputParams) {
        queryColumns.modelName = inputParams.model_name;
      }
      if ('model_code' in inputParams) {
        queryColumns.modelCode = inputParams.model_code;
      }
      if ('parent_model' in inputParams) {
        queryColumns.parentModelId = inputParams.parent_model;
      }
      if ('status' in inputParams) {
        queryColumns.status = inputParams.status;
      }
      if ('added_by' in inputParams) {
        queryColumns.addedBy = inputParams.added_by;
      }
      if ('brand_id' in inputParams) {
        queryColumns.brandId = inputParams.brand_id;
      }
      queryColumns.addedDate = () => 'NOW()';
      const queryObject = this.modelEntityRepo;
      const res = await queryObject.insert(queryColumns);
      const data = {
        insert_id: res.raw.insertId,
      };

      const success = 1;
      const message = 'Model Added Successfully.';

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
    inputParams.insert_model_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }

  async modelFinishSuccess(inputParams: any, message: string) {
    const settingFields = {
      status: 200,
      success: 1,
      message: message,
      fields: [],
    };
    settingFields.fields = ['insert_id', 'insert_model_data'];

    const outputKeys = ['insert_model_data'];
    const outputAliases = {
      insert_id: 'id',
    };
    const outputObjects = ['insert_model_data'];

    const outputData: any = {};
    outputData.settings = settingFields;
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'model_add';

    funcData.output_keys = outputKeys;
    funcData.output_alias = outputAliases;
    funcData.output_objects = outputObjects;
    funcData.single_keys = this.singleKeys;
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: '',
        data: inputParams.insert_id ? inputParams.insert_id : inputParams.id
      },
    };
    await this.general.submitGearmanJob(job_data);
    // job_data = {
    //   job_function: 'sync_elastic_data',
    //   job_params: {
    //     module: 'brand_list',
    //     data: ''
    //   },
    // };
    // await this.general.submitGearmanJob(job_data);
    return this.response.outputResponse(outputData, funcData);
  }

  modelFinishFailure(inputParams: any) {
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
        name: 'model_add',
      },
    );
  }
}
