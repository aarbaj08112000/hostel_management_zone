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
import { CommentEntity, AttachmentsEntity } from '../entities/comments.entity';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';
import { ElasticService } from '@repo/source/services/elastic.service';
import * as moment from 'moment';
import { LookupEntity } from '@repo/source/entities/lookup.entity';
import { SellCarEntity } from '../entities/sell_car.entity';

@Injectable()
export class CommentService extends BaseService {
    protected readonly log = new LoggerHandler(
        CommentService.name,
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
    @InjectRepository(CommentEntity)
    protected commentEntity: Repository<CommentEntity>;
    @InjectRepository(SellCarEntity)
    protected sellCarEntity: Repository<SellCarEntity>;
    @InjectRepository(AttachmentsEntity)
    protected attachmentsEntity: Repository<AttachmentsEntity>;
    @InjectRepository(LookupEntity)
    private lookupRepo: Repository<LookupEntity>;

    constructor(protected readonly elasticService: ElasticService) {
        super();
    }

    async getComment(inputParams) {
        try {
            let fileConfig: FileFetchDto;
            const aws_folder = await this.general.getConfigItem('AWS_SERVER');
            fileConfig = {};
            fileConfig.source = 'amazon';
            fileConfig.extensions = await this.general.getConfigItem('allowed_extensions');
            const rows = await this.commentEntity
                .createQueryBuilder('c')
                .leftJoin('attachments', 'a', 'a.commentId = c.id')
                .leftJoin('lookup', 'l', 'l.entityId = c.addedBy') // Join lookup on addedBy
                .select([
                    'c.id AS id',
                    'c.comment AS comment',
                    'c.entityType AS entityType',
                    'c.entityId AS entityId',
                    'c.addedBy AS added_by',
                    'c.addedDate AS added_date',
                    'a.fileName AS fileName',
                    `JSON_UNQUOTE(JSON_EXTRACT(l.entityJson, '$.name')) AS added_name`, // Extract name from entityJson
                ])
                .where('c.entityType = :entityType', { entityType: inputParams.type })
                .andWhere('c.entityId = :entityId', { entityId: inputParams.id })
                .orderBy('c.addedDate', 'DESC')
                .getRawMany();

                const resultMap = new Map();

                for (const row of rows) {
                    if (!resultMap.has(row.id)) {
                        const formattedDate = row.added_date
                            ? moment(row.added_date).format('DD-MM-YYYY hh:mm A')
                            : null;
                        resultMap.set(row.id, {
                            id: row.id,
                            comment: row.comment,
                            entityType: row.entityType,
                            entityId: row.entityId,
                            addedBy: row.added_by,
                            addedName: row.added_name || null,
                            addedDate: formattedDate,
                            attachments: [],
                        });
                    }

                    if (row.fileName) {
                        fileConfig.image_name = row.fileName;
                        fileConfig.path = `comment_${aws_folder}/${row.id}`;
                        row.fileName = await this.general.getFile(fileConfig, inputParams);
                        resultMap.get(row.id).attachments.push(row.fileName);
                    }
                }

                const result = Array.from(resultMap.values());

                if (result.length > 0) {
                    return {
                        success: 1,
                        message: 'Comments fetched successfully.',
                        data: result,
                    };
                } else {
                    throw new Error('No comments found.');
                }
        } catch (err) {
            console.log(err);
            return { 
                success: 0, 
                message: err.message || 'Something went wrong.',
                data: []
            };
        }
    }

    async addComment(inputParams) {
        try {
            let fileInfo: any = {};
            let uploadResult: any = {};
            fileInfo = await this.processFiles(inputParams);

            const queryColumns: any = {};
            if ('comment' in inputParams) queryColumns.comment = inputParams.comment;
            if ('entity_type' in inputParams) queryColumns.entityType = inputParams.entity_type;
            if ('entity_id' in inputParams) queryColumns.entityId = inputParams.entity_id;
            if ('added_by' in inputParams) queryColumns.addedBy = inputParams.added_by;
            queryColumns.addedDate = () => 'NOW()';
            
            const res = await this.commentEntity.insert(queryColumns);

            const sellQueryColumns: any = {};
            sellQueryColumns.status = inputParams.status;
            const queryObject = this.sellCarEntity
                .createQueryBuilder()
                .update(SellCarEntity)
                .set(sellQueryColumns);
            if (!custom.isEmpty(inputParams.entity_id)) {
                queryObject.andWhere('id = :id', { id: inputParams.entity_id });
            }
            const resNew = await queryObject.execute();
            let job_data = {
                job_function: 'sync_elastic_data',
                job_params: {
                    module: 'sell_car_list',
                    data: inputParams.entity_id,
                },
            };
            await this.general.submitGearmanJob(job_data)

            const attachmentQuery  : any = []
            if('attachment' in fileInfo){
                uploadResult = await this.uploadFiles(
                    fileInfo.attachment,
                    inputParams,
                    res.raw.insertId
                );

                for (const file of fileInfo.attachment) {
                    const mappedData = {
                        fileName: file.file_name,
                        commentId: res.raw.insertId,
                        addedBy: inputParams.added_by,
                        addedDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                    };
                    attachmentQuery.push(mappedData);
                }
                const queryObject = this.attachmentsEntity;
                const resl = await queryObject.save(attachmentQuery);
            }
            return { success: 1, message: "Comment added successfully." };
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
                    extensions:'pdf,doc,docx,gif,png,jpg,jpeg,jpe,bmp,ico,webp',
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
                upload_path: `comment_${aws_folder}/${id}/`,
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
}
