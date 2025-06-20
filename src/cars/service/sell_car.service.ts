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
import { SellCarEntity, SellCarAttachmentsEntity } from '../entities/sell_car.entity';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';
import { ElasticService } from '@repo/source/services/elastic.service';
import * as moment from 'moment';

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
    @InjectRepository(SellCarAttachmentsEntity)
    protected sellCarAttachmentsEntity: Repository<SellCarAttachmentsEntity>;

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
            const data = await Promise.all(
                results.hits.map(async (hit) => {
                    hit._source['contact'] = hit._source['dial_code']+' '+hit._source['phone_number'];
                    if(hit._source['attachments']){
                        hit._source['attachments'] = hit._source['attachments'].split(',');
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
            const currency_code = await this.general.getConfigItem('ADMIN_CURRENCY_PREFIX');
            const data = await this.elasticService.getById(id, 'nest_local_sell_car_list', 'id');
            if (_.isObject(data) && !_.isEmpty(data)) {
                if(data.attachments){
                    data.attachments = data.attachments.split(',');
                }
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

            const queryColumns: any = {};
            queryColumns.code = code;
            if ('name' in inputParams) queryColumns.name = inputParams.name;
            if ('dial_code' in inputParams) queryColumns.dialCode = inputParams.dial_code;
            if ('phone_number' in inputParams) queryColumns.phoneNumber = inputParams.phone_number;
            if ('email' in inputParams) queryColumns.email = inputParams.email;
            if ('message' in inputParams) queryColumns.message = inputParams.message;
            if ('brand_id' in inputParams) queryColumns.brandId = inputParams.brand_id;
            if ('model_id' in inputParams) queryColumns.modelId = inputParams.model_id;
            if ('variant_id' in inputParams) queryColumns.variantId = inputParams.variant_id;
            if ('color_id' in inputParams) queryColumns.colorId = inputParams.color_id;
            if ('location_id' in inputParams) queryColumns.locationId = inputParams.location_id;
            if ('year' in inputParams) queryColumns.year = inputParams.year;
            if ('km_reading' in inputParams) queryColumns.kmReading = inputParams.km_reading;
            if ('appointment_date' in inputParams) queryColumns.appointmentDate = inputParams.appointment_date;
            if ('appointment_time' in inputParams) queryColumns.appointmentTime = inputParams.appointment_time;
            queryColumns.addedDate = () => 'NOW()';

            const otherDetails: any = {};
            if ('other_brand' in inputParams) otherDetails.other_brand = inputParams.other_brand;
            if ('other_model' in inputParams) otherDetails.other_model = inputParams.other_model;
            if ('other_variant' in inputParams) otherDetails.other_variant = inputParams.other_variant;
            if ('other_color' in inputParams) otherDetails.other_color = inputParams.other_color;

            if (Object.keys(otherDetails).length > 0) {
                queryColumns.otherDetails = otherDetails;
            }
            
            const res = await this.sellCarEntity.insert(queryColumns);

            const formattedSlotDate = moment(inputParams.appointment_date).format('dddd, DD MMMM YYYY');

            // Determine time of day (Morning / Afternoon / Evening / Night)
            const getTimeOfDay = (timeRange: string) => {
                const startHour = parseInt(timeRange.split(':')[0]);
                if (startHour >= 5 && startHour < 12) return 'Morning';
                if (startHour >= 12 && startHour < 17) return 'Afternoon';
                if (startHour >= 17 && startHour < 21) return 'Evening';
                return 'Night';
            };

            const formattedSlotTime = (() => {
                const timeRange = inputParams.appointment_time || '';
                const [startTime, endTime] = timeRange.split(' - ');

                const formatTime = (time: string) => {
                const m = moment(time, 'HH:mm:ss');
                return `${m.format('hh')}:${m.format('mm')} ${m.format('A')}`;
                };

                const timeOfDay = getTimeOfDay(startTime);
                return `${timeOfDay} ${formatTime(startTime)} - ${formatTime(endTime)}`;
            })();

            const formattedSlotInfo = `${formattedSlotDate}, ${formattedSlotTime}`;

            let locationDetails = null;
            if (inputParams.location_id){
                const location_data = await this.elasticService.getById(inputParams.location_id, 'nest_local_location', 'id');
                if (location_data && !_.isEmpty(location_data)) {
                    locationDetails = {
                        location_name: location_data.location_name || null,
                        location_address: location_data.location_address || null,
                        address: location_data.google_address || null,
                        zip_code: location_data.zip_code || null,
                        latitude: location_data.latitude || null,
                        longitude: location_data.longitude || null,
                        };
                }
            }

            const attachmentQuery  : any = []
            if('attachment' in fileInfo){
                uploadResult = await this.uploadFiles(
                    fileInfo.attachment,
                    inputParams,
                    res.raw.insertId
                );
                const aws_folder = await this.general.getConfigItem('AWS_SERVER');
                const allowedExtensions = await this.general.getConfigItem('allowed_extensions');

                for (const file of fileInfo.attachment) {
                    const fileConfig: FileFetchDto = {
                        source: 'amazon',
                        extensions: allowedExtensions,
                        path: `sell_car_${aws_folder}/${res.raw.insertId}`,
                        image_name: file.file_name
                    };

                    const mappedData = {
                        attachmentName: file.file_name,
                        sourceId: res.raw.insertId,
                        fileType: file.file_type,
                        fileSize: file.file_size,
                        filePath: await this.general.getFile(fileConfig, inputParams),
                    };
                    attachmentQuery.push(mappedData);
                }
                const queryObject = this.sellCarAttachmentsEntity;
                const resl = await queryObject.save(attachmentQuery);
            }

            let job_data = {
                job_function: 'sync_elastic_data',
                job_params: {
                    module: 'sell_car_list',
                    data: res.raw.insertId,
                },
            };
            await this.general.submitGearmanJob(job_data)
            return { success: 1, message: "Thank you for contacting us. We'll get in touch with you shortly.", data: code, formattedSlotInfo, locationDetails };
        } catch (err) {
            return { success: 0, message: err.message };
        }
    }

    async processFile(paramKey, uploadInfo, params) {
        let temp_upload = [];
        if (paramKey in params && !custom.isEmpty(params[paramKey])) {
            const images = params[paramKey]
            const tmpUploadPath = await this.general.getConfigItem('upload_temp_path');
            if (Array.isArray(images)) {
            images.forEach((image) => {
                const filePath = `${tmpUploadPath}${image}`;
                if (this.general.isFile(filePath)) {
                const fileInfo = {
                    name: image,
                    file_name: image,
                    file_path: filePath,
                    file_type: this.general.getFileMime(filePath),
                    file_size: this.general.getFileSize(filePath),
                    max_size: paramKey === 'car_document' ? 512000 : 102400,
                    extensions:
                    paramKey === 'car_document'
                        ? 'pdf,doc,docx'
                        : 'gif,png,jpg,jpeg,jpe,bmp,ico,webp',
                };
                temp_upload.push(fileInfo);
                }
            })
            }
            uploadInfo[paramKey] = temp_upload
        }
    }

    async uploadFiles(uploadInfo, params, id?) {
        let uploadResults = {};
        const aws_folder = await this.general.getConfigItem('AWS_SERVER');
        for (const key in uploadInfo) {
            if ('name' in uploadInfo[key]) {
            uploadResults[key] = await this.general.uploadFile(
                {
                source: 'amazon',
                upload_path: `sell_car_${aws_folder}/${id}/`,
                extensions: uploadInfo[key].extensions,
                file_type: uploadInfo[key].file_type,
                file_size: uploadInfo[key].file_size,
                max_size: uploadInfo[key].max_size,
                src_file: uploadInfo[key].file_path,
                dst_file: uploadInfo[key].name,
                },
                params,
            );
            }
        }
        return uploadResults;
    }

    async processFiles(params) {
        let uploadInfo = {};
        await this.processFile('attachment', uploadInfo, params);
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
          'message',
          'brand_id',
          'model_id',
          'variant_id',
          'color_id',
          'location_id',
          'year',
          'km_reading',
          'appointment_date',
          'appointment_time',
          'other_details',
          'attachments',
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
