import { Controller, UseFilters, Post, Req, Request, Body, Delete, Param, Get, Query, Put, UploadedFiles, UseInterceptors, } from '@nestjs/common';
import { HttpExceptionFilter } from '@repo/source/filters/http-exception.filter';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { AnyFilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { validate, Validate } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';

// Add - Update imports
import { CarTagAddService } from './service/car_tag_add.service';
import { TagCarAddDto, TagCarUpdateDto, TagCarDeleteDto } from './dto/car_tag.dto';
import { CarTagsAddService } from './service/car_tags_add.service';
import { CarTagsAddDto } from './dto/car_tags_add.dto';
import { CarFeatureAddService } from './service/car_feature_add.service';
import { CarFeatureAddDto, CarFeatureUpdateDto } from './dto/car_feature.dto';
import { ModelAddService } from './service/model_add.service';
import { ModelAddDto, ModelUpdateDto } from './dto/model.dto';
import { BodyAddService } from './service/body_add.service';
import { BodyAddDto, BodyUpdateDto } from './dto/body.dto';

// Details imports
import { CarModelDetailsDto } from './dto/car_model_details.dto';
import { CarModelDetailsService } from './service/car_model_details.service';
import { BodyTypeDetailsDto } from './dto/body_type_details.dto';
import { BodyTypeDetailsService } from './service/body_type_details.service';

// Listing imports
import * as custom from '@repo/source/utilities/custom-helper';
import { CarImagesDto, CarAddImageFileDto, carImageDeleteDto, UpdateCarImagesDTO } from './dto/car_images.dto';
import { carImageAddService } from './service/car_image.service';
import { CarImageDeleteService } from './service/car_image_delete.service';
import { CarFeaturesService } from './service/car_features.service';
import { CarDropDownListService } from './service/car_dropdown.service';
import { CarDetailsService } from './service/car_details.service';
import { CarModuleService } from './service/car_module.service';
import { CarSlideService } from './service/car_slide.service';
import { CarListDto } from './dto/car_list.dto';
import { CarAddDto, UpdateCarDTO, CarsAddFileDto, CarsDetailsDto } from './dto/car_add.dto';
import { CarHistoryAddDto, CarHistoryUpdateDto } from './dto/car_add.dto';
import { CarListService } from './service/cars_list.service';
import { CarsAddService } from './service/cars_add.service';
import { CarTagAddDto, CarDetailsDto, UpdateCarDetailsDTO, } from './dto/car_add_details.dto';
import { BrandService } from './service/brand.service';
import { VariantListService } from './service/variant_list.service';
import { BodyListService } from './service/body_list.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { ColorService } from './service/color.service';
import { CarDocumentAddService } from './service/car_document_add.service';
import { CarAddDocumentFileDto, carDocumentDeleteDto, CarDocumentsDto } from './dto/car_documents.dto';
import { CarDocumentDeleteService } from './service/car_document_delete.service';
import { TestDriveListService } from './service/test_drive_list.service';
import { TestDriveAddService } from './service/test_drive_add.service';
import { TestDriveDetailsService } from './service/test_drive_details.service';
import { TestDriveAddAttachmentDto, TestDriveAddDto, TestDriveDetailsDto, TestDriveUpdateAttachmentDto, TestDriveUpdateDto } from './dto/test_drive.dto';
import { CarWishlistService } from './service/car_wishlist.service';
import { CarWishlistDto } from './dto/car_wishlist.dto';
import { filter } from 'lodash';
import { parseArgs } from 'util';
import { CarListFrontService } from './service/car_list_front.service';
import { CarFrontDetailsService } from './service/car_front_details.service';
import { CarCompareDetailsService } from './service/car_compare.service';
import { Client, ClientTCP, MessagePattern, Payload } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
@Controller()
@UseFilters(HttpExceptionFilter)
export class CarController {
  CarDocumentDeleteService: any;
  constructor(
    protected readonly general: CitGeneralLibrary,
    protected readonly configService: ConfigService,
    private carImageAddService: carImageAddService,
    private CarImageDeleteService: CarImageDeleteService,
    private carSlideSpec: CarSlideService,
    private carModuleServide: CarModuleService,
    private carDetailsService: CarDetailsService,
    private carListService: CarListService,
    private carAddService: CarsAddService,
    private carFeatureListService: CarFeaturesService,
    private carDropDownService: CarDropDownListService,
    private readonly carModelDetailsService: CarModelDetailsService,
    protected carTagService: CarTagAddService,
    protected carTagsService: CarTagsAddService,
    protected carFeatureService: CarFeatureAddService,
    private brandListService: BrandService,
    private variantListService: VariantListService,
    private bodyListService: BodyListService,
    private elasticService: ElasticService,
    private colorListService: ColorService,
    protected modelService: ModelAddService,
    protected bodyService: BodyAddService,
    private readonly bodyTypeDetailsService: BodyTypeDetailsService,
    private carDocumentAddService: CarDocumentAddService,
    private carDocumentDeleteService: CarDocumentDeleteService,
    private testDriveListService: TestDriveListService,
    private testDriveAddService: TestDriveAddService,
    private testDriveDetailsService: TestDriveDetailsService,
    private carWishlistService: CarWishlistService,
    private carFrontListService: CarListFrontService,
    private carFrontDetailService: CarFrontDetailsService,
    private carCompareDetail: CarCompareDetailsService,
  ) { }
  @Client({ transport: Transport.TCP, options: { port: 5005 } }) 
  public client: ClientTCP; 
  async onModuleInit() {
    try {
      let retries = 5;
      while (retries) {
        try {
          await this.client.connect();
          console.log('Client connected successfully!');
          break;
        } catch (error) {
          retries--;
          console.error('Failed to connect, retrying...', error);
          if (retries === 0) {
            console.error('Failed to connect after multiple retries');
          }
          await new Promise(res => setTimeout(res, 2000)); 
        }
      }
    } catch (error) {
      console.error('Failed to connect to microservice', error);
    }
  }
  @MessagePattern('car-data')
  async getUser( @Req() request: Request, @Payload() payload: string) {
    const index = 'nest_local_cars';
    let search_by = 'id';
    let search_key = payload['car_id'];
    let inputParams = {
      search_key,
      index,
      search_by,
    };
    return this.carFrontDetailService.startCarDetails(request,inputParams);
  }
  @Post('car-compare')
  async carCompare(
    @Req() request: Request,
    @Body()
    body,
  ) {
    let search_by = 'slug';
    let search_key = body.slug;
    const index = 'nest_local_cars';
    let inputParams = {
      search_key,
      index,
      search_by,
    };
    return await this.carCompareDetail.startCarDetails(request, inputParams);
  }
  @Get('front-cars-details')
  async frontCarDetail(
    @Req() request: Request,
    @Query()
    body: CarsDetailsDto,
  ) {
    let search_by = 'slug';
    let search_key = body.car_slug;
    const index = 'nest_local_cars';
    let inputParams = {
      search_key,
      index,
      search_by,
    };
    return await this.carFrontDetailService.startCarDetails(request, inputParams);
  }
  @Post('front-cars-list')
  async frontCarList(@Req() request: Request, @Body() body: CarListDto) {
    try {
      body.is_front = 'Yes'
      const params = body;
      if ('is_front' in params && params.is_front === 'Yes') {
        if (!params.filters) {
          params.filters = {};
        }
        params.filters = this.map_arr(params.filters)
        Object.assign(params.filters, {
          ...(params.brand && { brandName: params.brand }),
          ...(params.model && { modelName: params.model }),
          ...(params.tag && { car_tag: params.tag })
        });

        if (!params.sort) {
          params.sort = [];
        }

        if (typeof params.sort === 'object' && !Array.isArray(params.sort)) {
          params.sort = Object.entries(params.sort).map(([key, dir]) => ({
            prop: key,
            dir: dir
          }));
        }
      }
      return await this.carFrontListService.startCarList(request, params);
    } catch (err) {
      console.log(err)
    }
  }

  @Post('car-feature-add')
  async carFeatureAdd(@Req() request: Request, @Body() body: CarFeatureAddDto) {
    const params = body;
    return await this.carFeatureService.addCarFeatures(request, params);
  }

  @Put('car-feature-update')
  async carFeatureUpdate(@Req() request: Request, @Body() body: CarFeatureUpdateDto) {
    const params = body;
    return await this.carFeatureService.updateCarFeatures(request, params);
  }

  @Post('car-feature')
  async carFeature(@Req() request: Request, @Body() body: CarListDto) {
    const params = body;
    return await this.carFeatureListService
      .startCarFeatures(request, params);
  }

  @Post('car-tag-add')
  async carTagAdd(@Req() request: Request, @Body() body: TagCarAddDto) {
    const params = body;
    return await this.carTagService.addCarTags(request, params);
  }

  @Delete('car-tag-delete/:id')
  async carTagDelete(@Param('id') id: string) {
    return await this.carTagService.DeleteCarTags(id);
  }

  @Put('car-tag-update')
  async carTagUpdate(@Req() request: Request, @Body() body: TagCarUpdateDto) {
    const params = body;
    return await this.carTagService.updateCarTags(request, params);
  }

  @Post('car-tags-add')
  async carTagsAdd(@Req() request: Request, @Body() body: CarTagsAddDto) {
    const params = body;
    return await this.carTagsService.addCarTags(request, params);
  }

  @Get('car-dropdown')
  async carDropdown(@Req() request: Request, @Query() params: any) {
    return await this.carDropDownService.startCarDropDownList(request, params);
  }

  @Get('car-slides')
  async carSlides(
    @Req() request: Request,
    @Query()
    body,
  ) {
    let tagName;
    let body_code;
    if ('tag_name' in body) {
      tagName = body.tag_name;
    }
    if ('type' in body) {
      body_code = body.type;
    }
    let inputParams = {
      tagName,
      body_code
    };
    return await this.carSlideSpec.startCarSlide(request, inputParams);
  }

  @Delete('car-image-delete')
  async carImageDelete(@Req() request: Request, @Body() body: carImageDeleteDto) {
    const params = body;
    return await this.CarImageDeleteService.startCarImageDelete(request, params);
  }

  @Post('car-images')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'external_images' },
      { name: 'internal_images' },
    ]),
  )
  async uploadImages(
    @Req() request: Request,
    @Body() body: CarImagesDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    let fileDto;
    let carId = body.car_id;
    let existed_image_data = await this.carImageAddService.fetchImageData(carId);
    if (existed_image_data.length > 0) {
      fileDto = new UpdateCarImagesDTO();
    } else {
      fileDto = new CarAddImageFileDto();
    }
    /*File Sectionn*/

    fileDto.external_images = files?.external_images;
    fileDto.internal_images = files?.internal_images;
    const errors = await validate(fileDto, { whitelist: true });

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => {
          if (error.hasOwnProperty('constraints')) {
            return Object.values(error.constraints);
          } else {
            return [];
          }
        })
        .flat();
      if (errorMessages.length > 0) {
        const response = {
          statusCode: 400,
          success: 0,
          message: 'Validation failed',
          errors: errorMessages,
        };
        return response;
      }
    }
    const uploadPromises = [];
    let temp = [];
    if (typeof files !== 'undefined' && Object.keys(files).length > 0) {
      for (const [key, value] of Object.entries(files)) {
        const fieldFiles = files[key];
        for (const file of fieldFiles) {
          const fileName = await this.general.temporaryUpload(file);
          uploadPromises.push(fileName);
          temp.push({
            file: key,
            image: fileName,
          });
        }
      }
    }

    const car_images = {
      internal_images: [],
      external_images: [],
    };
    temp.forEach(({ file, image }) => {
      if (car_images[file]) {
        car_images[file].push(image);
      }
    });
    await Promise.all(uploadPromises);
    body['car_images'] = car_images;
    const params = body;
    return await this.carImageAddService.startcarImageAdd(request, params);
  }

  @Delete('car-document-delete')
  async carDocumentDelete(@Req() request: Request, @Body() body: carDocumentDeleteDto) {
    const params = body;
    return await this.carDocumentDeleteService.startCarDocumentDelete(request, params);
  }

  @UseInterceptors(AnyFilesInterceptor())
  @Post('/car-documents')
  async carDocumentAdd(
    @Req() request: Request,
    @UploadedFiles() uploadedFiles: Express.Multer.File[],
    @Body() body: any,
  ): Promise<any> {
    try {
      let fileDto = new CarAddDocumentFileDto();

      // File section: Map uploaded files to DTO
      fileDto.uploaded_file = uploadedFiles;
      const errors = await validate(fileDto, { whitelist: true });

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => {
            if (error.hasOwnProperty('constraints')) {
              return Object.values(error.constraints);
            } else {
              return [];
            }
          })
          .flat();
        if (errorMessages.length > 0) {
          return {
            statusCode: 400,
            message: 'Validation failed',
            errors: errorMessages,
          };
        }
      }

      // Temporary file upload
      const uploadPromises = [];
      const temp = [];
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const fileName = await this.general.temporaryUpload(file);
          uploadPromises.push(fileName);
          temp.push({
            file: file.fieldname,
            document: fileName,
          });
        }
      }

      await Promise.all(uploadPromises);

      // Prepare the document object
      const car_documents = {};
      temp.forEach(({ file, document }) => {
        if (!car_documents[file]) {
          car_documents[file] = [];
        }
        car_documents[file].push(document);
      });

      // Attach the processed documents to the request body
      body = { ...body, ...car_documents };

      const params = body;

      // Call the service to add car documents
      return await this.carDocumentAddService.startCarDocumentAdd(request, params);
    } catch (error) {
      console.error('Error while adding car documents:', error);
      return {
        settings: {
          status: 400,
          success: 0,
          message: 'Failed to add car documents. Error: ' + error.message,
        },
        data: {},
      };
    }
  }

  @Post('cars-add')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'car_image' },
      { name: 'car_other_images' },
      // { name: 'car_document' },
    ]),
  )
  async carAdd(
    @Req() request: Request,
    @Body()
    body: {
      car_data: CarAddDto | UpdateCarDTO;
      car_details?: CarDetailsDto | UpdateCarDetailsDTO;
      car_history?: CarHistoryAddDto | CarHistoryUpdateDto;
      car_tags?: CarTagAddDto;
      car_feature?: CarFeatureAddDto;
    },
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    try {
      const { car_data, car_details, car_history, car_tags } = body;
      /*File Sectionn*/
      const fileDto = new CarsAddFileDto();
      fileDto.car_image = files?.car_image;
      fileDto.car_other_images = files?.car_other_images;
      // fileDto.car_document = files?.car_document;

      const errors = await validate(fileDto, { whitelist: true });

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => {
            if (error.hasOwnProperty('constraints')) {
              return Object.values(error.constraints);
            } else {
              return [];
            }
          })
          .flat();
        if (errorMessages.length > 0) {
          const response = {
            statusCode: 400,
            success: 0,
            message: 'Validation failed',
            errors: errorMessages,
          };
          return response;
        }
      }

      if (typeof files?.car_document != 'undefined') {
        if (typeof body['document_type'] == 'undefined') {
          return {
            statusCode: 400,
            success: 0,
            message: 'Validation failed',
            error: "please provide document type if uploading car documents"
          }
        }
      }

      let document_temp = body['document_type'] ? JSON.parse(body['document_type']) : {};
      let document_type_assoc = []
      if (Object.keys(document_temp).length > 0) {
        document_temp.map((key) => {
          const fileName = key?.file_name;
          const doc_id = key?.doc_type;
          if (fileName) {
            if (!document_type_assoc[fileName]) {
              document_type_assoc[fileName] = [];
            }
            document_type_assoc[fileName] = doc_id;
          } else {
            console.warn('Missing file_name for key:', doc_id);
          }
        });
      }

      const uploadPromises = [];
      if (typeof files !== 'undefined' && Object.keys(files).length > 0) {
        for (const [key, value] of Object.entries(files)) {
          const fieldFiles = files[key];
          let document_temp = [];
          for (const file of fieldFiles) {
            const fileName = await this.general.temporaryUpload(file);
            uploadPromises.push(fileName);
            if (key == 'car_document') {
              document_temp.push({
                file_name: document_type_assoc[file.originalname],
                uploaded_name: fileName,
              });
              body['car_document'] = document_temp;
            } else {
              car_data[key] = fileName;
            }
          }
        }
      }

      await Promise.all(uploadPromises);
      /*File Section End */
      let car_id = car_data['car_id'];
      let fetchCarData;
      if (typeof car_id != 'undefined') {
        fetchCarData = await this.carAddService.fetchCarData(car_id);
      }

      let carDataDto;

      if ('car_id' in car_data && car_data.car_id) {
        carDataDto = Object.assign(new UpdateCarDTO(), car_data);
      } else {
        carDataDto = Object.assign(new CarAddDto(), car_data);
      }
      const carDataErrors = await validate(carDataDto);
      if (carDataErrors.length > 0) {
        return { message: 'Invalid car data', errors: carDataErrors };
      }
      if (car_details) {
        let carDetailsDto;
        if (
          'car_id' in car_data &&
          car_data.car_id &&
          fetchCarData.existed_car_details != null &&
          typeof fetchCarData.existed_car_details != 'undefined'
        ) {
          carDetailsDto = Object.assign(new UpdateCarDetailsDTO(), car_details);
        } else {
          carDetailsDto = Object.assign(new CarDetailsDto(), car_details);
        }

        const carDetailsError = await validate(carDetailsDto);
        if (carDetailsError.length > 0) {
          return { message: 'Invalid car details data', error: carDetailsError };
        }
      }
      if (car_history) {
        let carHistoryDto;
        if (
          'car_id' in car_data &&
          car_data.car_id &&
          fetchCarData.existed_car_history_details != null &&
          typeof fetchCarData.existed_car_history_details != 'undefined'
        ) {
          carHistoryDto = Object.assign(new CarHistoryUpdateDto(), car_history);
        } else {
          carHistoryDto = Object.assign(new CarHistoryAddDto(), car_history);
        }
        const carHistorysError = await validate(carHistoryDto, {
          whitelist: true,
        });
        if (carHistorysError.length > 0) {
          return { message: 'Invalid car details data', error: carHistorysError };
        }
      }
      if (car_tags) {
        let carTagDto = Object.assign(new CarTagAddDto(), car_tags);
        const carTagDtoError = await validate(carTagDto, {
          whitelist: true,
        });
        if (carTagDtoError.length > 0) {
          return { message: 'Invalid car details data', error: carTagDtoError };
        }
      }
      const params = body;
      return await this.carAddService.startCarAdd(request, params);
    }
    catch (err) {
      console.log(err)
    }
  }

  @Get('cars-detail')
  async fetchCarDetail(
    @Req() request: Request,
    @Query()
    body: CarsDetailsDto,
  ) {
    let search_by = '';
    let search_key = '';
    if ('car_id' in body) {
      search_key = body.car_id;
      search_by = 'id';
    } else {
      search_key = body.car_slug;
      search_by = 'slug';
    }
    const index = 'nest_local_cars';
    let inputParams = {
      search_key,
      index,
      search_by,
    };
    return await this.carDetailsService.startCarDetails(request, inputParams);
  }

  @Post('cars-list')
  async carList(@Req() request: Request, @Body() body: CarListDto) {
    try {
      const params = body;

      if ('is_front' in params && params.is_front === 'Yes') {
        params.filters = this.map_arr(params.filters)

        if (!params.filters) {
          params.filters = {};
        }

        Object.assign(params.filters, {
          ...(params.brand && { brandName: params.brand }),
          ...(params.model && { modelName: params.model }),
          ...(params.tag && { car_tag: params.tag })
        });
        if (!params.sort) {
          params.sort = [];
        }

        if (typeof params.sort === 'object' && !Array.isArray(params.sort)) {
          params.sort = Object.entries(params.sort).map(([key, dir]) => ({
            prop: key,
            dir: dir
          }));
        }
      }
      return await this.carListService.startCarList(request, params);
    } catch (err) {
      console.log(err)
    }
  }

  @Get('car-compare-dropdown')
  async getCarCompareData(@Req() request: Request, @Query() params: any) {
    if ('brandName' in params) {
      params['filters'] = [{ "key": "brandCode", "value": params['brandName'], "operator": "contain" }];
    }

    if ('modelName' in params) {
      params['filters'] = [
        ...(params['filters'] || []),
        { "key": "modelName", "value": params['modelName'].toLowerCase(), "operator": "contain" }
      ];
    }

    let carList = await this.carList(request, params);
    carList = {
      settings: carList['settings'],
      data: Object.values(carList['data']).map((key) => ({
        image: key['car_image'],
        car_name: key['carName'],
        car_slug: key['car_slug'],
        price: key['price'],
        curreny_code: key['currency_code'],
        distance_driven: this.general.numberFormat(key['drivenDistance'], 'numerical') + ' ' + 'Miles',
        color: key['exteriorColorName'],
        manufacture_year: key['manufactureYear'],
        brand_name: key['brandName']
      }))
    }
    return carList
  }

  @Get('process-car-data')
  async processCarData(@Query('index') index: string, @Query('slug') slug: string) {
    if (index != '') {
      let query = {
        size: 0,
        query: {
          term: { [`slug.keyword`]: slug }
        },
        aggs: {
          total_views: {
            value_count: { field: `slug.keyword` }
          },
          total_visitor: {
            cardinality: { field: `visitorId.keyword` }
          }
        }
      }
      let analaytics_res = await this.elasticService.searchGlobalData(index, query, 'Yes')
      let data = {
        visitors: analaytics_res['total_visitor']['value'] ? analaytics_res['total_visitor']['value'] : 0,
        views: analaytics_res['total_views']['value'] ? analaytics_res['total_views']['value'] : 0
      }
      let to_update_index = 'nest_local_cars';
      return await this.elasticService.updateElasticDocument(slug, to_update_index, 'slug', 'analytics', data);

    }
  }

  @Post('car-filter')
  async fetchCarFilter(@Req() request: Request, @Body() parameters: any) {
    let filter_arr = {};
    let params: any = {};
    if (!params.filters) {
      params.filters = {};
    }
    parameters.filters = this.map_arr(parameters.filters);
    params.filters = { status: 'Active' };
    let exteriorColor = await this.colorListService.startColor(request, params);
    exteriorColor = {
      searchParam: 'color',
      searchType: 'eq',
      label: custom.lang('Color'),
      values: exteriorColor['data'].length > 0 ? Object.values(exteriorColor['data']).map((key) => ({
        key: key['color_name'].toLowerCase(),
        value: key['color_code'],
        label: key['color_name'],
      })) : [],
    };

    filter_arr = { ...filter_arr, exteriorColor };

    let brandName = await this.brandListService.startBrand(request, params);
    brandName = {
      searchParam: 'brand',
      searchType: 'eq',
      label: custom.lang('Brand'),
      values: brandName['data'].length > 0 ? Object.values(brandName['data']).map((key) => ({
        key: key['brand_code'].toLowerCase(),
        value: key['brand_name'],
        image: key['brand_image'] ? key['brand_image'] : ''
      })) : [],
    };

    filter_arr = { ...filter_arr, brandName };

    let bodyType = await this.bodyList(request, params);

    bodyType = {
      searchParam: 'body',
      searchType: 'eq',
      label: custom.lang('Body Type'),
      values: bodyType['data'].length > 0 ? Object.values(bodyType['data']).map((key) => ({
        key: key['body_code'].toLowerCase(),
        value: key['body_type'],
      })) : [],
    };
    filter_arr = { ...filter_arr, bodyType };

    if ('brandCode' in parameters.filters) {
      params['is_front'] = 'Yes';
      params['filters'] = { 'brand_code': parameters.filters['brandCode'] }
    }
    let modelName = await this.modelList(request, params);

    modelName = {
      searchParam: 'model',
      searchType: 'eq',
      label: custom.lang('Model'),
      values: modelName['data'].length > 0 ? Object.values(modelName['data']).map((key) => ({
        key: key['model_code'].toLowerCase(),
        value: key['model_name'],
        brandCode: key['brand_code']
      })) : [],
    };

    filter_arr = { ...filter_arr, modelName };

    if ('filters' in params) {
      delete params['filters']
    }
    if ('modelName' in parameters.filters) {
      params['is_front'] = 'Yes';
      params['filters'] = { 'model_code': parameters.filters['modelName'] }
    }
    let carVariant = await this.variantListService.startVariantList(request, params);
    carVariant = {
      searchParam: 'carVariant',
      searchType: 'eq',
      label: custom.lang('Variants'),
      values: carVariant['data'].length > 0 ? Object.values(carVariant['data']).map((key) => ({
        key: key['variant_code'].toLowerCase(),
        value: key['variant_name'],
        modelCode: key['model_code']
      })) : [],
    };

    filter_arr = { ...filter_arr, carVariant };
    if ('filters' in params) {
      delete params['filters']
    }
    let fuelType = {
      searchParam: 'fuel',
      searchType: 'eq',
      label: custom.lang('Fuel Type'),
      values: [
        {
          key: 'Petrol',
          value: 'Petrol',
        },
        {
          key: 'Diesel',
          value: 'Diesel',
        },
        {
          key: 'Hybrid',
          value: 'Hybrid',
        },
        {
          key: 'Electric',
          value: 'Electric',
        },
      ],
    };
    filter_arr = { ...filter_arr, fuelType };
    let transmissionType = {
      searchParam: 'transmission',
      searchType: 'eq',
      label: custom.lang('Transmission'),
      values: [
        {
          key: 'Manual',
          value: 'Manual',
        },
        {
          key: 'Automatic',
          value: 'Automatic',
        },
        {
          key: 'semiAutomatic',
          value: 'Semi Automatic',
        },
      ],
    };
    filter_arr = { ...filter_arr, transmissionType };
    let manufactureYear = {
      searchParam: 'year',
      searchType: 'btw',
      label: custom.lang('Year'),
      values: {
        from: '2021',
        to: '2025',
      },
    };
    filter_arr = { ...filter_arr, manufactureYear };

    let price_limit = await this.general.getConfigItem('PRICE_LIMIT');
    price_limit = price_limit.split('-');
    let carPrice = {
      searchParam: 'price',
      searchType: 'btw',
      label: custom.lang('Price'),
      values: {
        from: price_limit[0],
        to: price_limit[1],
      },
      default_values: {
        from: price_limit[0],
        to: price_limit[1],
      },
    };

    filter_arr = { ...filter_arr, carPrice };
    return filter_arr;
  }


  @Get('cars-filter')
  async fetchFilters(@Query('list') list: string) {
    return this.elasticService.fetchFilterData(list);
  }

  @Post('body-add')
  async BodyAdd(@Req() request: Request, @Body() body: BodyAddDto) {
    const params = body;
    return await this.bodyService.startBodyAdd(request, params);
  }

  @Put('body-update')
  async BodyUpdate(@Req() request: Request, @Body() body: BodyUpdateDto) {
    const params = body;
    return await this.bodyService.startBodyUpdate(request, params);
  }

  @Delete('body-delete/:id')
  async BodyDelete(@Param('id') id: string) {
    return await this.bodyService.DeleteBody(id);
  }

  @Post('body-list')
  async bodyList(@Req() request: Request, @Body() body: CarListDto) {
    const params = body;
    return await this.bodyListService.startBodyList(request, params);
  }

  @Get('body-type-detail')
  async fetchBodyTypeDetail(
    @Req() request: Request,
    @Query() body: BodyTypeDetailsDto,
  ) {
    let search_by = 'body_type_id';
    let search_key = body.body_type_id;
    const index = 'nest_local_body';
    let inputParams = {
      search_key,
      index,
      search_by,
    };
    return await this.bodyTypeDetailsService.startBodyTypeDetails(request, inputParams);
  }

  @Post('model-add')
  async ModelAdd(@Req() request: Request, @Body() body: ModelAddDto) {
    const params = body;
    return await this.modelService.startModelAdd(request, params);
  }

  @Put('model-update')
  async ModelUpdate(@Req() request: Request, @Body() body: ModelUpdateDto) {
    const params = body;
    return await this.modelService.startModelUpdate(request, params);
  }

  @Delete('model-delete/:id')
  async ModelDelete(@Param('id') id: string) {
    return await this.modelService.DeleteModel(id);
  }

  @Post('model-list')
  async modelList(@Req() request: Request, @Body() body: CarListDto) {
    const params = body;
    return await this.carModuleServide.startCarModule(request, params);
  }

  @Get('model-detail')
  async fetchCarModelDetail(
    @Req() request: Request,
    @Query() body: CarModelDetailsDto,
  ) {
    let search_by = 'modelId';
    let search_key = body.model_id;
    const index = 'nest_local_model';
    let inputParams = {
      search_key,
      index,
      search_by,
    };
    return await this.carModelDetailsService.startCarModelDetails(request, inputParams);
  }

  @Get('model-dropdown')
  async getModelDropdown(@Req() request: Request, @Query() params: any) {
    if ('brandName' in params) {
      params['filters'] = [{ "key": "brand_code", "value": params['brandName'], "operator": "contain" }]
    }
    let modelList = await this.modelList(request, params);

    return modelList = {
      settings: modelList['settings'],
      data: modelList['data'].length > 0 ? Object.values(modelList['data']).map((key) => ({
        value: key['model_name'],
        key: key['model_code'].toLowerCase(),
      })) : {}
    }
  }

  @Post('test-drive-add')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'attachment' },
    ]))
  async BrandAdd(@Req() request: Request, @Body() body: TestDriveAddDto, @UploadedFiles() files: Record<string, Express.Multer.File[]>,) {
    const fileDto = new TestDriveAddAttachmentDto();
    fileDto.attachment = files?.attachment;
    const errors = await validate(fileDto, { whitelist: true });

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => {
          if (error.hasOwnProperty('constraints')) {
            return Object.values(error.constraints);
          } else {
            return [];
          }
        })
        .flat();
      if (errorMessages.length > 0) {
        const response = {
          statusCode: 400,
          success: 0,
          message: 'Validation failed',
          errors: errorMessages,
        };
        return response;
      }
    }
    const uploadPromises = [];
    let temp = [];
    if (typeof files !== 'undefined' && Object.keys(files).length > 0) {
      for (const [key, value] of Object.entries(files)) {
        const fieldFiles = files[key];
        for (const file of fieldFiles) {
          const fileName = await this.general.temporaryUpload(file);
          uploadPromises.push(fileName);
          body[key] = fileName;
        }
      }
    }
    await Promise.all(uploadPromises);
    const params = body;
    return await this.testDriveAddService.startTestDriveAdd(request, params);
  }

  @Put('test-drive-update')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'attachment' },
    ]))
  async BrandUpdate(@Req() request: Request, @Body() body: TestDriveUpdateDto, @UploadedFiles() files: Record<string, Express.Multer.File[]>,) {

    const fileDto = new TestDriveUpdateAttachmentDto();
    fileDto.attachment = files?.attachment;
    const errors = await validate(fileDto, { whitelist: true });

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => {
          if (error.hasOwnProperty('constraints')) {
            return Object.values(error.constraints);
          } else {
            return [];
          }
        })
        .flat();
      if (errorMessages.length > 0) {
        const response = {
          statusCode: 400,
          success: 0,
          message: 'Validation failed',
          errors: errorMessages,
        };
        return response;
      }
    }
    const uploadPromises = [];
    let temp = [];
    if (typeof files !== 'undefined' && Object.keys(files).length > 0) {
      for (const [key, value] of Object.entries(files)) {
        const fieldFiles = files[key];
        for (const file of fieldFiles) {
          const fileName = await this.general.temporaryUpload(file);
          uploadPromises.push(fileName);
          body[key] = fileName;
        }
      }
    }
    await Promise.all(uploadPromises);
    const params = body;
    return await this.testDriveAddService.startTestDriveUpdate(request, params);
  }

  @Post('test-drive-list')
  async testDriveList(@Req() request: Request, @Body() body: CarListDto) {
    const params = body;
    return await this.testDriveListService.startTestDriveList(request, params);
  }

  @Get('test-drive-detail')
  async fetchTestDriveDetail(
    @Req() request: Request,
    @Query() body: TestDriveDetailsDto,
  ) {
    let search_by = 'id';
    let search_key = body.id;
    const index = 'nest_local_test_drive_list';
    let inputParams = {
      search_key,
      index,
      search_by,
    };
    return await this.testDriveDetailsService.startTestDriveDetails(request, inputParams);
  }

  @Post('car-wishlist-add')
  async carWishlistAdd(@Req() request: ExpressRequest, @Body() body: CarWishlistDto) {
    return await this.carWishlistService.addToWishlist(request, body);
  }

  @Delete('car-wishlist-delete')
  async carWishlistDelete(@Req() request: ExpressRequest, @Body() body: CarWishlistDto) {
    return await this.carWishlistService.removeFromWishlist(request, body);
  }
  map_arr(type) {
    try {
      if (typeof type === 'undefined') {
        return {};
      }
      const mapping = {
        'color': 'exteriorColorName',
        'brand': 'brandCode',
        'body': 'body_code',
        'model': 'modelName',
        'fuel': 'fuelType',
        'transmission': 'transmissionType',
        'year': 'manufactureYear'
      };

      let mapped_filter = {};
      for (const key in type) {
        if (type.hasOwnProperty(key)) {
          if (mapping[key]) {
            mapped_filter[mapping[key]] = type[key];
          } else {
            mapped_filter[key] = type[key]
          }
        }
      }
      return mapped_filter;
    } catch (err) {
      console.error(err);
    }
  }
}