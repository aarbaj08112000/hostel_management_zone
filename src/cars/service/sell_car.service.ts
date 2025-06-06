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
import { BaseService } from '@repo/source/services/base.service';
import { SellCarEntity } from '../entities/sell_car.entity';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';
import { ElasticService } from '@repo/source/services/elastic.service';

@Injectable()
export class SellCarService extends BaseService {
    protected readonly log = new LoggerHandler(
        SellCarService.name,
    ).getInstance();
    protected inputParams: object = {};
    protected blockResult: BlockResultDto;
    protected settingsParams: SettingsParamsDto;
    protected singleKeys: any[] = [];
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
    @InjectRepository(SellCarEntity)
    protected sellCarEntity: Repository<SellCarEntity>;

    constructor(protected readonly elasticService: ElasticService) {
        super();
    }

    async startSellCarList(reqObject, reqParams) {
        let outputResponse = {};
        try {
            this.requestObj = reqObject;
            this.inputParams = reqParams;
            let inputParams = reqParams;
    
            inputParams = await this.getSellCar(inputParams);
            if (!_.isEmpty(inputParams.sell_car)) {
                outputResponse = this.sellCarFinishSuccess(inputParams);
            } else {
                outputResponse = this.sellCarFinishFailure(inputParams);
            }
        } catch (err) {
            this.log.error('API Error >> sell_car >>', err);
        }
        return outputResponse;
    }

    async getSellCar(inputParams: any) {
        let fileConfig: FileFetchDto;
        fileConfig = {};
        fileConfig.source = 'amazon';
        fileConfig.extensions = await this.general.getConfigItem('allowed_extensions');
        this.blockResult = {};
        try {
            let index = 'nest_local_sell_car_list';
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
            if (!_.isObject(results) || _.isEmpty(results)) {
                throw new Error('No records found.');
            }
            const totalCount = results['total']['value'];
            this.settingsParams = custom.getPagination(
                totalCount,
                pageIndex,
                recLimit,
            );
            if (totalCount <= 0) {
                throw new Error('No records found.');
            }
            const aws_folder = await this.general.getConfigItem('AWS_SERVER');
            const data = await Promise.all(
                results.hits.map(async (hit) => {
                    hit._source['contact'] = hit._source['dial_code']+' '+hit._source['phone_number'];
                    fileConfig.image_name = hit._source['attachment'];
                    fileConfig.path = `sell_car_${aws_folder}`;
                    if (hit._source['attachment']) {
                        hit._source['attachment'] = await this.general.getFile(fileConfig, inputParams);
                    }
                    return hit._source;
                })
            );
    
            if (_.isObject(data) && data.length > 0) {
                const success = 1;
                const message = 'Records found.';
    
                const queryResult = {
                    success,
                    message,
                    data,
                };
                this.blockResult = queryResult;
            } else {
                throw new Error('No records found.');
            }
        } catch (err) {
          this.blockResult.success = 0;
          this.blockResult.message = err;
          this.blockResult.data = [];
        }
        inputParams.sell_car = this.blockResult.data;
        return inputParams;
    }

    async startSellCarDetail(id) {
        try {
            let fileConfig: FileFetchDto = {};
            const currency_code = await this.general.getConfigItem('ADMIN_CURRENCY_PREFIX');
            const aws_folder = await this.general.getConfigItem('AWS_SERVER');
            fileConfig.source = 'amazon';
            fileConfig.extensions = await this.general.getConfigItem('allowed_extensions');
            const data = await this.elasticService.getById(id, 'nest_local_sell_car_list', 'id');
            if (_.isObject(data) && !_.isEmpty(data)) {
                fileConfig.image_name = data.attachment;
                fileConfig.path = `sell_car_${aws_folder}`;
                data['attachment'] = data.attachment ? await this.general.getFile(fileConfig, data) : '';
                data['contact'] = data.dial_code+' '+data.phone_number;
                return {
                    success: 1,
                    message: 'Records found.',
                    data,
                };
            } else {
                throw new Error('No records found.');
            }
        } catch (err) {
            return { 
                success: 0, 
                message: err.message || 'Something went wrong.',
                data: []
            };
        }
    }

    async sellCar(inputParams) {
        try {
            let fileInfo: any = {};
            let uploadResult: any = {};
            fileInfo = await this.processFiles(inputParams);

            let code = await this.general.getCustomToken('sell_car', 'SC', 'Add');

            const data = this.sellCarEntity.create({
                code: code,
                name: inputParams.name,
                dialCode: inputParams.dial_code,
                phoneNumber: inputParams.phone_number,
                email: inputParams.email,
                brandName: inputParams.brand_name,
                modelName: inputParams.model_name,
                message: inputParams.message,
                attachment: inputParams.attachment || null,
                addedDate: new Date(),
            });

            let res = await this.sellCarEntity.save(data);
            uploadResult = await this.uploadFiles(
                fileInfo,
                inputParams,
                res.id,
            );
            let job_data = {
                job_function: 'sync_elastic_data',
                job_params: {
                    module: 'sell_car_list',
                    data: res.id,
                },
                };
                await this.general.submitGearmanJob(job_data)
            return { success: 1, message: "Thank you for contacting us. We'll get in touch with you shortly.", data: code };
        } catch (err) {
            return { success: 0, message: err.message };
        }
    }

    async uploadFiles(uploadInfo, params, id?) {
        let uploadResults = {};
        const aws_folder = await this.general.getConfigItem('AWS_SERVER');
        for (const key in uploadInfo) {
            if ('name' in uploadInfo[key]) {
                const uploadConfig = {
                    source: 'amazon',
                    upload_path: `sell_car_${aws_folder}/`,
                    extensions: uploadInfo[key].extensions,
                    file_type: uploadInfo[key].file_type,
                    file_size: uploadInfo[key].file_size,
                    max_size: uploadInfo[key].max_size,
                    src_file: uploadInfo[key].file_path,
                    dst_file: uploadInfo[key].name,
                };

                uploadResults[key] = await this.general.uploadFile(
                    uploadConfig,
                    params,
                );
            }
        }
        return uploadResults;
    }

    async processFile(paramKey, uploadInfo, params) {
        if (paramKey in params && !custom.isEmpty(params[paramKey])) {
            const tmpUploadPath = await this.general.getConfigItem('upload_temp_path');
            const filePath = `${tmpUploadPath}${params[paramKey]}`;

            if (this.general.isFile(filePath)) {
                const fileInfo = {
                    name: params[paramKey],
                    file_name: params[paramKey],
                    file_path: filePath,
                    file_type: this.general.getFileMime(filePath),
                    file_size: this.general.getFileSize(filePath),
                    max_size: paramKey === 'car_document' ? 512000 : 102400,
                    extensions: 'pdf,doc,docx,gif,png,jpg,jpeg,jpe,bmp,ico,webp',
                };
                uploadInfo[paramKey] = fileInfo;
                return fileInfo;
            }
        }
        return null;
    }

    async processFiles(params) {
        let uploadInfo = {};

        await Promise.all([
            this.processFile.call(this, 'attachment', uploadInfo, params)
        ]);

        return uploadInfo;
    }

    sellCarFinishSuccess(inputParams: any) {
        const settingFields = {
          status: 200,
          success: 1,
          message: custom.lang('Sell Car list found.'),
          fields: [],
        };
        settingFields.fields = [
          'id',
          'code',
          'name',
          'dial_code',
          'phone_number',
          'contact',
          'email',
          'brand_name',
          'model_name',
          'message',
          'attachment',
          'added_date',
        ];
        if ('skip_brand' in inputParams && inputParams.skip_brand == 'Yes') {
          settingFields.fields.push('model_codes')
        }
        const outputKeys = ['sell_car'];
    
        const outputData: any = {};
        outputData.settings = { ...settingFields, ...this.settingsParams };
        outputData.data = inputParams;
    
        const funcData: any = {};
        funcData.name = 'sell_car';
    
        funcData.output_keys = outputKeys;
        funcData.multiple_keys = this.multipleKeys;
        return this.response.outputResponse(outputData, funcData);
      }
    
    sellCarFinishFailure(inputParams: any) {
        const settingFields = {
            status: 200,
            success: 0,
            message: custom.lang('Sell Car list not found.'),
            fields: [],
        };
        return this.response.outputResponse({
            settings: settingFields,
            data: inputParams,
        },
        {
            name: 'sell_car',
        });
    }
}
