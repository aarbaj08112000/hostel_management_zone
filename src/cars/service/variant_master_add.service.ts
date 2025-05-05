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
import { VariantMasterEntity } from '../entities/variant-master.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';
@Injectable()
export class VariantMasterAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    VariantMasterAddService.name,
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
  @InjectRepository(VariantMasterEntity)
  protected variantMasterEntityRepo: Repository<VariantMasterEntity>;

  /**
   * constructor method is used to set preferences while service object initialization.
   */
  constructor() {
    super()
    this.singleKeys = ['custom_unique_condition', 'insert_variant_master_data', 'update_variant_master_data'];
    this.moduleName = 'variant_master';
    this.moduleAPI = '';
    this.serviceConfig = {
      module_name: 'variant_master',
      table_name: 'variant_master',
      table_alias: 'vm',
      primary_key: 'variantId',
      primary_alias: 'vm_id',
      unique_fields: {
        type: 'and',
        fields: {
          variant_code: 'variantCode',
        },
        message: 'Record already exists with this Trim Code',
      },
      expRefer: {},
      topRefer: {},
    };
  }

  async startVariantMasterUpdate(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');
      let inputParams = reqParams;

      inputParams = await this.customUniqueCondition(inputParams);
      if (inputParams.unique_status === 1) {
        outputResponse = this.variantMasterUniqueFailure(inputParams);
      } else {
        inputParams = await this.updateVariantMasterData(inputParams);
        if (!_.isEmpty(inputParams.update_variant_master_data)) {
          outputResponse = this.variantMasterFinishSuccess(inputParams, 'Trim Updated successfully.');
        } else {
          outputResponse = this.variantMasterFinishFailure(inputParams);
        }
      }
    } catch (err) {
      this.log.error('API Error >> variant_master_update >>', err);
    }
    return outputResponse;
  }
  async updateVariantMasterData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('variant_name' in inputParams) {
        queryColumns.variantName = inputParams.variant_name;
      }
      if ('status' in inputParams) {
        queryColumns.status = inputParams.status;
      }
      if ('updated_by' in inputParams) {
        queryColumns.updatedBy = inputParams.updated_by;
      }
      if ('model_id' in inputParams) {
        queryColumns.modedId = inputParams.model_id;
      }
      queryColumns.updatedDate = () => 'NOW()';
      const queryObject = this.variantMasterEntityRepo
        .createQueryBuilder()
        .update(VariantMasterEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id)) {
        queryObject.andWhere('variantId = :id', { id: inputParams.id });
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
    inputParams.update_variant_master_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }
  async DeleteVariantMaster(id) {
    let outputResponse = {};

    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteVariantMasterData(id);
      if (inputParams.deleted_variant_master) {
        let job_data = {
          job_function: 'delete_elastic_data',
          job_params: {
            module: 'nest_local_variant_list',
            data: id
          },
          path: 'api/master/delete-data'
        };
        await this.general.submitGearmanJob(job_data);
        outputResponse = this.variantMasterFinishSuccess(inputParams, inputParams.message);
      } else {
        outputResponse = this.variantMasterFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> variant_master_delete >>', err);
    }
    return outputResponse;
  }

  async deleteVariantMasterData(id: any) {
    try {
      let variantId = id;
      const deleteResult = await this.variantMasterEntityRepo.delete({ variantId });

      if (deleteResult.affected === 0) {
        return { success: 0, message: 'No Trim found.' };
      }

      return {
        success: 1,
        message: 'Trim Deleted Successfully.',
        deleted_variant_master: deleteResult.affected
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }
  async startVariantMasterAdd(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      let inputParams = reqParams;

      inputParams = await this.customUniqueCondition(inputParams);
      if (inputParams.unique_status === 1) {
        outputResponse = this.variantMasterUniqueFailure(inputParams);
      } else {
        inputParams = await this.insertVariantMasterData(inputParams);
        if (!_.isEmpty(inputParams.insert_variant_master_data)) {
          outputResponse = this.variantMasterFinishSuccess(inputParams, 'Trim Added successfully.');
        } else {
          outputResponse = this.variantMasterFinishFailure(inputParams);
        }
      }
    } catch (err) {
      this.log.error('API Error >> variant_master_add >>', err);
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

  variantMasterUniqueFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Record already exists with this Trim Code'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'variant_master_add',
      },
    );
  }

  async insertVariantMasterData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('variant_name' in inputParams) {
        queryColumns.variantName = inputParams.variant_name;
      }
      if ('variant_code' in inputParams) {
        queryColumns.variantCode = inputParams.variant_code;
      }
      if ('status' in inputParams) {
        queryColumns.status = inputParams.status;
      }
      if ('added_by' in inputParams) {
        queryColumns.addedBy = inputParams.added_by;
      }
      if ('model_id' in inputParams) {
        queryColumns.modedId = inputParams.model_id;
      }

      queryColumns.addedDate = () => 'NOW()';
      const queryObject = this.variantMasterEntityRepo;
      const res = await queryObject.insert(queryColumns);
      const data = {
        insert_id: res.raw.insertId,
      };

      const success = 1;
      const message = 'Trim Added Successfully.';

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
    inputParams.insert_variant_master_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );
    return inputParams;
  }

  async variantMasterFinishSuccess(inputParams: any, message: string) {
    const settingFields = {
      status: 200,
      success: 1,
      message: message,
      fields: [],
    };
    settingFields.fields = ['insert_id', 'insert_variant_master_data'];

    const outputKeys = ['insert_variant_master_data'];
    const outputAliases = {
      insert_id: 'id',
    };
    const outputObjects = ['insert_variant_master_data'];

    const outputData: any = {};
    outputData.settings = settingFields;
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'variant_master_add';

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
    return this.response.outputResponse(outputData, funcData);
  }

  variantMasterFinishFailure(inputParams: any) {
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
        name: 'variant_master_add',
      },
    );
  }
}
