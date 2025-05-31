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
import { BodyAddDto, BodyAddImageFileDto, BodyUpdateDto, BodyUpdateImageFileDto } from './dto/body.dto';
import { VariantMasterAddService } from './service/variant_master_add.service';
import { VariantMasterAddDto, VariantMasterUpdateDto } from './dto/variant_master.dto';
import { VariantDetailsDto } from './dto/variant_details.dto';
import { VariantDetailsService } from './service/variant_details.service';
import { VariantListService } from './service/variant_list.service';
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
import { CarAddDto, UpdateCarDTO, CarsAddFileDto, CarsDetailsDto, TimeSlotDto } from './dto/car_add.dto';
import { CarHistoryAddDto, CarHistoryUpdateDto } from './dto/car_add.dto';
import { CarListService } from './service/cars_list.service';
import { CarsAddService } from './service/cars_add.service';
import { CarTagAddDto, CarDetailsDto, UpdateCarDetailsDTO, } from './dto/car_add_details.dto';
import { BrandService } from './service/brand.service';
import { BodyListService } from './service/body_list.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { CarDocumentAddService } from './service/car_document_add.service';
import { CarAddDocumentFileDto, carDocumentDeleteDto, CarDocumentsDto } from './dto/car_documents.dto';
import { CarDocumentDeleteService } from './service/car_document_delete.service';
import { CarWishlistService } from './service/car_wishlist.service';
import { CarWishlistAdminDto, CarWishlistDto } from './dto/car_wishlist.dto';
import { CarListFrontService } from './service/car_list_front.service';
import { CarFrontDetailsService } from './service/car_front_details.service';
import { CarCompareDetailsService } from './service/car_compare.service';
import { CarPublishUpdateDto } from './dto/car_publish_update.dto';
import { CarPublishUpdateService } from './service/car_publish_update.service';
import { LocationtimeSlotService } from './service/location_timelot.service';
import { DistanceDto } from './dto/distance.dto';
import { CarMicroserviceService } from './service/car_microservice.service';
import { CommonInterceptor } from './service/common_interceptor_service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BrandAddService } from './service/brand_add.service';
import { BrandAddDto, BrandUpdateDto, BrandAddImageFileDto, BrandUpdateImageFileDto } from './dto/brand.dto';
import { BrandDetailsDto } from './dto/brand_details.dto';
import { BrandDetailsService } from './service/brand_details.service';
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';
import { TagMasterDetailsDto } from './dto/tag_master_details.dto';
import { TagMasterDetailsService } from './service/tag_master_details.service';
import { CarChargesService } from './service/car_charges_add.service';
import { CarChargesDto , UpdateCarChargesDto } from './dto/car_charges.dto';
import { CarServicesAdd } from './service/car_service_add.service';
import { CarServicesDto , UpdateCarServicesDto } from './dto/car_services.dto';
import { ActivityLogService } from '@repo/source/services/activity_log.service';
import { ActivityLogAddDto, ActivityLogListDto } from '@repo/source/common/dto/activity_log.dto';
import { CarFrontCompareService } from './service/front-car-compare_service';
import { GetLookupData } from './service/fetch_lkp_data.service';
import { SellCarAddImageDto, SellCarDto } from './dto/sell_car.dto';
import { SellCarService } from './service/sell_car.service';
@Controller()
@UseFilters(HttpExceptionFilter)
@UseInterceptors(CommonInterceptor)
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
    private bodyListService: BodyListService,
    private elasticService: ElasticService,
    protected modelService: ModelAddService,
    protected bodyService: BodyAddService,
    private readonly bodyTypeDetailsService: BodyTypeDetailsService,
    private carDocumentAddService: CarDocumentAddService,
    private carDocumentDeleteService: CarDocumentDeleteService,
    private carWishlistService: CarWishlistService,
    private carFrontListService: CarListFrontService,
    private carFrontDetailService: CarFrontDetailsService,
    private carCompareDetail: CarCompareDetailsService,
    private carPublishUpdateService: CarPublishUpdateService,
    private timeSlotService: LocationtimeSlotService,
    private carMicroservice : CarMicroserviceService,
    protected brandService: BrandAddService,
    private readonly brandDetailsService: BrandDetailsService,
    protected variantMasterService: VariantMasterAddService,
    private readonly variantDetailsService: VariantDetailsService,
    private variantListService: VariantListService,
    private carTagDetails : TagMasterDetailsService,
    private carChargesService : CarChargesService,
    private carServices : CarServicesAdd,
    private activityLogService : ActivityLogService,
    private carFrontCompareService : CarFrontCompareService,
    private sellCarService : SellCarService,
    private getLookupData: GetLookupData,
  ) { }
  @MessagePattern('update-status')
  async updateCustomer(@Req() request: Request, @Payload() payload: any){
    try{
    return this.carAddService.updateCarStatus(payload.data)
    }catch(err){
      console.log(err)
    }
  }

  @MessagePattern('get-data')
  async getMasterData( @Req() request: Request, @Payload() payload: any) {
    try {
      return this.carMicroservice.getData(payload);
    }catch(err){
      console.log(err);
    }
  }
  
  @Get('get-lookup-data')
    async fetchLookupData(@Body() body: CarListDto){
      return await this.getLookupData.getLkpData(body);
    }

  @Post('get-activity-log')
  async getActivityLog(@Req() request: Request, @Body() body: ActivityLogListDto) {
    const params = body;
    return await this.activityLogService.startActivityLogList(params);
  }
  @MessagePattern('set-data')
  async setCarData( @Req() request: Request, @Payload() payload: any) {
    try{
      await this.carMicroservice.setData(payload);
      await this.elasticService.syncElasticData()
      return {success : 1 , message : 'data set success'}
    }catch(err){
      console.log(err)
    }
  }
  @Get('front-car-compare')
  async frontCarCompare(
    @Req() request: Request,
    @Query()
    body: CarsDetailsDto,
  ) {
    let dev_publish = body?.dev_publish ? body.dev_publish : 'No'
    let location_enabled = body.location_enabled
    let search_by = 'slug';
    let search_key = body.car_slug;
    const index = 'nest_local_cars';
    let inputParams = {
      search_key,
      index,
      search_by,
      dev_publish,
      location_enabled
    };
    return await this.carFrontCompareService.startCarDetails(request, inputParams);
  }
  @Get('car-services-detail/:id')
  async carServiceDetails(@Param('id') id: string) {
    return await this.carServices.startCarServiceDetails(id);
  }
  @Post('car-service-add')
  async carServicesAdd (@Req() request: Request, @Body() body : CarServicesDto){
    try{
      return await this.carServices.startCarServicesAdd(request,body)
    }catch(err){
      console.log(err)
    }
  }
  @Put('car-service-update')
  async carServicesUpdate (@Req() request: Request, @Body() body : UpdateCarServicesDto){
    try{
      return await this.carServices.startCarServicesUpdate(request,body)
    }catch(err){
      console.log(err)
    }
  }
  @Delete('car-service-delete/:id')
  async deleteCarService(@Param('id') id: string) {
    return await this.carServices.deleteCarService(parseInt(id));
  }

  @Get('car-charges-detail/:id')
  async carChargesDetails(@Param('id') id: string) {
    return await this.carChargesService.startCarChargesDetails(id);
  }

  @Post('car-charges-add')
  async carChargesAdd (@Req() request: Request, @Body() body : CarChargesDto){
    try{
      return await this.carChargesService.startCarChargesAdd(request,body)
    }catch(err){
      console.log(err)
    }
  }
  @Put('car-charges-update')
  async carChargesUpdate (@Req() request: Request, @Body() body : UpdateCarChargesDto){
    try{
      return await this.carChargesService.startCarChargesUpdate(request,body)
    }catch(err){
      console.log(err)
    }
  }
  @Delete('car-charges-delete/:id')
  async deleteCarCharges(@Param('id') id: string) {
    return await this.carChargesService.deleteCarCharges(parseInt(id));
  }
  @Post('user-data')
  async addUserDataasync(@Req() request: Request, @Body() body) {
    try {
      const params = body;
      let sync_params = {
        "syn_vUniqueKey": "user-navigate-log",
        "syn_iBulkUploadLimit": 100,
        "syn_vUniqueIndex": "user_navigate"
      }
      let { urlPath } = body
      if (typeof urlPath != 'undefined') {
        if (urlPath.includes('car-detail')) {
          let slug = urlPath.split('/car-detail/')[1]
          body['slug'] = slug
        }
      }
      let response = await this.elasticService.createSyncData(sync_params, [body])
      if (typeof body['slug'] != 'undefined' && body['slug'] != '') {
        let job_data = {
          job_function: 'process_car_data',
          job_params: {
            module: 'nest_local_user_navigate',
            data: body['slug']
          },
          path: 'api/car/process-car-data'
        };
        // await this.general.submitGearmanJob(job_data);
       await  this.processCarData('nest_local_user_navigate',body['slug'])
      }
      return response[0]['items'][0].index.status == 201 ? { success: 1, message: "Data added Successfully" } : { success: 0, message: "Something went wrong" }
    } catch (err) {
      console.log(err)
    }
  }
  @Get('buy-cars')
  async buyCars(@Req() request: Request, @Query() params: any){
    params['is_global'] = 'Yes';
    params['is_front'] = 'Yes';
    params['filters'] = { is_trending: "Yes"}
    let car_index = 'nest_local_tag_car_list'
    let search_params = this.general.createElasticSearchQuery(params);
    let buyCars : any = {};
    const result = await this.elasticService.search(
      car_index,
      search_params,
    );
    const totalCount = result['total']['value'];
    if (totalCount > 0) { 
    const data = result.hits.map((hit) => {
      return hit._source;
    })
    buyCars = {
          values: data.map((key) => ({
            label: key['tag_name'],
            tag: key['tag_code'] ?? '',
            data: key['car_details']
            ? key['car_details']
                .filter(
                  (val) =>
                    (val?.status === 'Available' || val?.status === 'Booked') &&
                    val?.isListed === 'Yes'
                )
                .map((val) => ({
                  car_id: val?.car_id,
                  car_name: val?.car_name,
                  car_slug: val?.car_slug,
                  display_title : val?.display_title,
                }))
            : []
          
          })),
        };
    }else{
      buyCars = {
        success : 0,
        message : 'No Data found'
      }
    }
    return buyCars
  }
  @Get('global-data')
  async getFooterData(@Req() request: Request, @Query() params: any) {

    let final_data = {};

    let facebook = await this.general.getConfigItem('COMPANY_FACEBOOK_URL');
    let instagram = await this.general.getConfigItem('COMPANY_INSTAGRAM_URL');
    let twitter = await this.general.getConfigItem('COMPANY_TWITTER_URL');
    let youtube = await this.general.getConfigItem('COMPANY_YOUTUBE_URL');
    let linkedin = await this.general.getConfigItem('COMPANY_LINKEDIN_URL');
    let threads = await this.general.getConfigItem('COMPANY_THREADS_URL');
    let whatsapp = await this.general.getConfigItem('COMPANY_WHATSAPP_URL');
    let google = await this.general.getConfigItem('COMPANY_GOOGLE_URL');
    final_data = {
      facebook, instagram, twitter, youtube, linkedin, threads, whatsapp, google
    }
    let return_data = {
      "header":
      {
      },
      "footer": {
        "socialMedia": final_data,
        "officeAddresses": [
          {
            "address": "Block-1 Unit-4 Al Hail Business Centre, <br>Next to KM Traiding, Behind Emirates, <br>Motors M4, Mussafah, Abu Dhabi, UAE",
            "city": "MUSSAFAH",
            "image": "https://kamdhenu-cars.s3.amazonaws.com/icons/image1.png"
          },
          {
            "address": "Deerfields Mall, Hypermarket Entrance, <br>Kisosk Ground Floor, 99 - Al Rubban St, <br>- Al Bahyah Abu Dhabi, UAE",
            "city": "SHAHAMA",
            "image": "https://kamdhenu-cars.s3.amazonaws.com/icons/image2.png"
          },
          {
            "address": "Al Mutakamela Vehicle Testing and Registration <br>Centre, Dubai shop, 32 - next to Permagard, <br>- Al Quoz Industrial Area 2, Dubai, UAE",
            "city": "AL QUOZ 2, DUBAI",
            "image": "https://kamdhenu-cars.s3.amazonaws.com/icons/image3.png"
          }
        ],
      }
    }

    return return_data
  }

  @Get('first-time-lookup')
  async firstTimeSync(){
    return await this.carMicroservice.firstTimeSyncLookup()
  }
  @Get('sync-elastic-data')
  async syncElasticData(@Query('index') index: string, @Query('dev') dev?: string) {
    return this.elasticService.syncElasticData(index, dev);
  }
  @Get('delete-elastic-data')
  async deleteElasticData(@Query('index') index: string, @Query('dev') dev?: string) {
    return this.elasticService.deleteAllDocumentsFromIndices(index);
  }
  @Get('car-tag-detail')
  async fetchTagMasterDetail(
    @Req() request: Request,
    @Query() body: TagMasterDetailsDto,
  ) {
    let search_by = 'tagMasterId';
    let search_key = body.tag_id;
    const index = 'nest_local_tag_car_list';
    let inputParams = {
      search_key,
      index,
      search_by,
    };
    return await this.carTagDetails.startTagMasterDetails(request, inputParams);
  }
  @Post('variant-master-add')
  async VariantMasterAdd(@Req() request: Request, @Body() body: VariantMasterAddDto) {
    const params = body;
    return await this.variantMasterService.startVariantMasterAdd(request, params);
  }

  @Put('variant-master-update')
  async VariantMasterUpdate(@Req() request: Request, @Body() body: VariantMasterUpdateDto) {
    const params = body;
    return await this.variantMasterService.startVariantMasterUpdate(request, params);
  }

  @Delete('variant-master-delete/:id')
  async VariantMasterDelete(@Param('id') id: string) {
    return await this.variantMasterService.DeleteVariantMaster(id);
  }

  @Post('variant-list')
  async variantList(@Req() request: Request, @Body() body: CarListDto) {
    const params = body;
    return await this.variantListService.startVariantList(request, params);
  }

  @Get('variant-detail')
  async fetchVariantDetail(
    @Req() request: Request,
    @Query() body: VariantDetailsDto,
  ) {
    let search_by = 'variantId';
    let search_key = body.variant_id;
    const index = 'nest_local_variant_list';
    let inputParams = {
      search_key,
      index,
      search_by,
    };
    return await this.variantDetailsService.startVariantDetails(request, inputParams);
  }
  @Get('home-page')
  async homePage(@Req() request: Request, @Query() params: any) {
    try {
      let fileConfig: FileFetchDto;
      fileConfig = {};
      fileConfig.source = 'amazon';
      fileConfig.extensions =
        await this.general.getConfigItem('allowed_extensions');
      let final_json = {};
      let carCount,
        brandCount = 0;
      let achievements = [];
      let title = await this.general.getConfigItem('HEADER_TITLE');
      let subTitle = await this.general.getConfigItem('HEADER_TITLE_DESCRIPTION');
      let searchBtn = await this.general.getConfigItem('SEARCH_BUTTON_NAME');
      let budgetSearchLabel = await this.general.getConfigItem(
        'BUDGET_SEARCH_LABEL',
      );
      let brandSearchLabel =
        await this.general.getConfigItem('BRAND_SEARCH_LABEL');
      final_json = {
        ...final_json,
        hero: {
          title,
          subTitle,
          searchBtn,
          budgetSearchLabel,
          brandSearchLabel,
        },
      };
      params['skip_brand'] = 'Yes'
      params['filters'] = [{ "key": "status", "value": "Active", "operator": "equal" }];
      // params['limit'] = 8;
      let premiumBrands = await this.brandList(request, params);
      let image_path =
        process.env.BASE_URL +
        '/' +
        this.configService.get('app.upload_url') +
        'brand_images';
      if (premiumBrands['data'].length > 0) {
        brandCount = premiumBrands['settings']['count'];
        premiumBrands = {
          title: custom.lang('Premium Brands'),
          subTitle: custom.lang('Explore Our'),
          btnName: custom.lang('Show All Brands'),
          values: Object.values(premiumBrands['data'])
          .filter((key) => key['model_codes'] != null && key['model_codes'] !== '')
          .map((key) => ({
            label: key['brand_name'],
            image: key['brand_image'] ? key['brand_image'] : '',
            key: key['brand_code'].toLowerCase(),
          })).slice(0, 8),
        };

        final_json = { ...final_json, premiumBrands };
      }
      if ('filters' in params) {
        delete params['filters']
        delete params['limit']
      }
      let trending_tags = JSON.parse(await this.general.getConfigItem('TRENDING_TYPES'));
      fileConfig.path = `icons`;
      let trendingCars = {
        title: custom.lang('Trending Cars'),
        subTitle: custom.lang('Most'),
        values: await Promise.all(
          Object.values(trending_tags)
            .map(async (key) => {
              fileConfig.image_name = key['icon'];
              return {
                icon: key['icon'] ? await this.general.getFile(fileConfig) : '',
                label: key['label'],
                tagName: key['tag_name'].toLowerCase(),
                type: key['type']
              };
            })
        ),
      }
      final_json = { ...final_json, trendingCars };
      carCount = 200;
      achievements.push({
        value: brandCount.toString(),
        title: "Car <span class='text-primary'>Brands</span>",
      });
      achievements.push({
        value: carCount.toString(),
        title: "Car <span class='text-primary'>Inventory</span>",
      });
      achievements.push({
        value: '90%',
        title: "Returning <span class='text-primary'>Customers</span>",
      });
      achievements.push({
        value: '2K+',
        title: "Happy <span class='text-primary'>Customers</span>",
      });
      achievements.push({
        value: '56',
        title: "Dealer <span class='text-primary'>Branches</span>",
      });
      final_json = { ...final_json, achievements };
      let benefits = [];
      benefits.push({
        value: '150+',
        title: "Car <span class='text-primary'>Check Points</span>",
      });
      benefits.push({
        value: '12',
        title: "Months <span class='text-primary'>Warranty</span>",
      });
      benefits.push({
        value: '03',
        title: "Free <span class='text-primary'>Service</span>",
      });
      benefits.push({
        value: '2000+',
        title: "Cars <span class='text-primary'>Largest Collection</span>",
      });
      final_json = { ...final_json, benefits };

      let badges = await this.general.getConfigItem('FRONT_SLIDES');
      badges = JSON.parse(badges)
      final_json = { ...final_json, badges }
      return final_json;
    } catch (err) {
      console.log(err)
    }
  }
  @Post('brand-add')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'brand_image' },
    ]))
  async BrandAdd(@Req() request: Request, @Body() body: BrandAddDto, @UploadedFiles() files: Record<string, Express.Multer.File[]>,) {
    const fileDto = new BrandAddImageFileDto();
    fileDto.brand_image = files?.brand_image;
    const errors = await validate(fileDto, { whitelist: true });
    await this.carMicroservice.processLookupDataFromBody(body)
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
    return await this.brandService.startBrandAdd(request, params);
  }

  @Put('brand-update')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'brand_image' },
    ]))
  async BrandUpdate(@Req() request: Request, @Body() body: BrandUpdateDto, @UploadedFiles() files: Record<string, Express.Multer.File[]>,) {

    const fileDto = new BrandUpdateImageFileDto();
    fileDto.brand_image = files?.brand_image;
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
    return await this.brandService.startBrandUpdate(request, params);
  }

  @Delete('brand-delete/:id')
  async BrandDelete(@Param('id') id: string) {
    return await this.brandService.DeleteBrand(id);
  }

  @Post('brand-list')
  async brandList(@Req() request: Request, @Body() body: CarListDto) {
    const params = body;
    return await this.brandListService.startBrand(request, params);
  }

  @Get('brand-detail')
  async fetchBrandDetail(
    @Req() request: Request,
    @Query() body: BrandDetailsDto,
  ) {
    let search_by = 'brandId';
    let search_key = body.brand_id;
    const index = 'nest_local_brand';
    let inputParams = {
      search_key,
      index,
      search_by,
    };
    return await this.brandDetailsService.startBrandDetails(request, inputParams);
  }

  @Get('brand-dropdown')
  async getBrandDropdown(@Req() request: Request, @Query() params: any) {
    let brandList = await this.brandList(request, params);
    let data  = await this.carAddService.fetchBrandModelPresentCar()
    const brandIds = data.map(item => item.brandId);
    return brandList ={
      settings: brandList['settings'],
      data: Array.isArray(brandList['data']) && brandList['data'].length > 0
        ? brandList['data']
            .filter(item => brandIds.includes(item['brand_id']))
            .map(item => ({
              value: item['brand_name'],
              image: item['brand_image'] || '',
              key: item['brand_code'].toLowerCase(),
            }))
        : []
    }
  }
  @Get('get-distance')
  async getDistance(@Req() request: Request, @Query() body: DistanceDto) {
    try {
      let { source_loc, dest_loc } = body
      const [sourceLat, sourceLon] = source_loc.split(',').map(Number);
      const [destLat, destLon] = dest_loc.split(',').map(Number);
      if ([sourceLat, sourceLon, destLat, destLon].some(isNaN)) {
        throw new Error("Invalid coordinate format");
      }
      return { success: 1, distance: this.general.calculateDistance(sourceLat, sourceLon, destLat, destLon) }
    } catch (err) {
      return { success: 0, message: err.message }
    }
  }
  @Get('time-slot')
  async getLocationTimeSlot(@Req() request: Request, @Query() body: TimeSlotDto) {
    let output: any;
    try {
      let search_by = '';
      let search_key = '';
      if ('car_id' in body) {
        search_key = body.car_id;
        search_by = 'id';
      } else {
        search_key = body.car_slug;
        search_by = 'slug';
      }
      let location_enabled = 'Yes'
      const index = 'nest_local_cars';
      let inputParams: any = {
        search_key,
        index,
        search_by,
        location_enabled
      };
      let response: any = await this.carFrontDetailService.startCarDetails(request, inputParams);
      if (response.settings.success == 1) {
        response.data = { ...response.data, requested_date: body.date }
        return await this.timeSlotService.startLocationtimeSlot(request, response.data)
      } else {
        return response
      }
    } catch (err) {
      console.log(err)
    }
  }

  @Post('car-compare')
  async carCompare(
    @Req() request: Request,
    @Body()
    body,
  ) {
    try {
      if (!('slug' in body)) {
        return {
          "settings": {
            "status": 200,
            "success": 0,
            "message": "please provide slug."
          },
          "data": {}
        }
      }
      let search_by = 'slug';
      let search_key = body.slug;
      const index = 'nest_local_cars';
      let inputParams = {
        search_key,
        index,
        search_by,
      };
      return await this.carCompareDetail.startCarDetails(request, inputParams);
    } catch (err) {
      console.log(err)
    }
  }
  @Get('front-cars-details')
  async frontCarDetail(
    @Req() request: Request,
    @Query()
    body: CarsDetailsDto,
  ) {
    let dev_publish = body?.dev_publish ? body.dev_publish : 'No'
    let location_enabled = body.location_enabled
    let search_by = 'slug';
    let search_key = body.car_slug;
    const index = 'nest_local_cars';
    let inputParams = {
      search_key,
      index,
      search_by,
      dev_publish,
      location_enabled
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
          params.sort = this.sort_map_arr(params.sort);
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

  @Put('car-publish-update')
  async carPublishUpdate(@Req() request: Request, @Body() body: CarPublishUpdateDto) {
    const params = body;
    return await this.carPublishUpdateService.updateCarStatus(params);
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
    let is_draft = body?.is_draft;
    fileDto.external_images = files?.external_images;
    fileDto.internal_images = files?.internal_images;
    const errors = await validate(fileDto, { whitelist: true });
    if (errors.length > 0 && is_draft != 'Yes') {
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
      carId?: string | number,
      is_draft?: string
    },
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    try {
      await this.carMicroservice.processLookupDataFromBody(body)
      if (body.carId !== undefined && body.carId !== '' && body.carId !== null) {
        if (body.car_data === undefined || body.car_data === null) {
          body.car_data = {} as CarAddDto | UpdateCarDTO;
        }
        body.car_data.car_id = body.carId;
      }
      let { car_data, car_details, car_history, car_tags, is_draft } = body;
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
      if ('car_details' in body || "car_history" in body || "car_tags" in body) {
        if (!("car_data" in body)) {
          return {
            success: 0,
            status: 404,
            message: 'Please enter value for carId'
          }
        }
      }
      let car_id = car_data['car_id'];
      let fetchCarData;
      if (typeof car_id != 'undefined') {
        fetchCarData = await this.carAddService.fetchCarData(car_id);
      }

      let carDataDto;

      if (('car_id' in car_data && car_data.car_id) || (typeof is_draft != 'undefined' && is_draft == 'Yes')) {
        car_data = { ...car_data, is_draft }
        carDataDto = Object.assign(new UpdateCarDTO(), car_data);
      } else {
        body.car_data = { ...body.car_data, status: 'Available' }
        carDataDto = Object.assign(new CarAddDto(), car_data);
      }
      const carDataErrors = await validate(carDataDto);
      if (carDataErrors.length > 0) {
        return { message: 'Invalid car data', errors: carDataErrors };
      }
      if (car_details) {
        let carDetailsDto;
        if ((
          'car_id' in car_data &&
          car_data.car_id &&
          fetchCarData.existed_car_details != null &&
          typeof fetchCarData.existed_car_details != 'undefined') || (typeof is_draft != 'undefined' && is_draft == 'Yes')
        ) {
          car_details = { ...car_details, is_draft }
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
        if ((
          'car_id' in car_data &&
          car_data.car_id &&
          fetchCarData.existed_car_history_details != null &&
          typeof fetchCarData.existed_car_history_details != 'undefined') || (typeof is_draft != 'undefined' && is_draft == 'Yes')
        ) {
          car_history = { ...car_history, is_draft }
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
      return err
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
    params['filters'] = [
      ...(params['filters'] || []),
      { "key": "isListed", "value": 'Yes', "operator": "in" },
      { "key": "status", "value": ['Booked', 'Available'], "operator": "in" }
    ];

    let carList = await this.carList(request, params);
    carList = {
      settings: carList['settings'],
      data: Object.values(carList['data']).map((key) => ({
        image: key['car_image'],
        car_name: key['carName'],
        car_slug: key['car_slug'],
        price: key['db_price'],
        curreny_code: key['currency_code'],
        distance_driven: this.general.numberFormat(key['drivenDistance'], 'numerical') + ' ' + 'Miles',
        color: key['exteriorColorName'],
        manufacture_year: key['manufactureYear'],
        brand_name: key['brandName'],
        status: key['status']
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
      let analaytics_res = await this.elasticService.searchAggrregate(index, query, 'Yes')
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
    try {
      let filter_arr = {};
      let params: any = {};
      if (!params.filters) {
        params.filters = {};
      }
      parameters.filters = this.map_arr(parameters.filters);
      params.filters = { status: 'Active' };

      let color_index = 'nest_local_color'
      let search_params = this.general.createElasticSearchQuery(params);
      const result = await this.elasticService.search(
        color_index,
        search_params,
      );
      let totalCount = result['total']['value'];
      if (totalCount > 0) {
        let exteriorColor : any 
        const data = result.hits.map((hit) => {
          return hit._source;
        });
        exteriorColor = {
          searchParam: 'color',
          searchType: 'eq',
          label: custom.lang('Color'),
          values:data.length > 0 ? data.map((key) => ({
            key: key['color_name'].toLowerCase(),
            value: key['color_code'],
            label: key['color_name'],
          })) : [],
        };
  
        filter_arr = { ...filter_arr, exteriorColor };
      }
      let tag_index = 'nest_local_tag_car_list'
      if ('filters' in params) {
        delete params['filters']
      }
      params.is_front = 'Yes'
      search_params = this.general.createElasticSearchQuery(params);
      const tag_result = await this.elasticService.search(
        tag_index,
        search_params,
      );
       totalCount = tag_result['total']['value'];
      if (totalCount > 0) {
        let badges : any 
        const data = tag_result.hits.map((hit) => {
          return hit._source;
        });
        badges = {
          searchParam: 'car_tag',
          searchType: 'eq',
          label: custom.lang('Badges'),
          values:data.length > 0 ? data.map((key) => ({
            key: key['tag_code'].toLowerCase(),
            value: key['tag_name'],
          })) : [],
        };
  
        filter_arr = { ...filter_arr, badges };
      }
      params = { ...params, skip_brand: 'Yes' }
      let brandName = await this.brandListService.startBrand(request, params);
      brandName = {
        searchParam: 'brand',
        searchType: 'eq',
        label: custom.lang('Brand'),
        values: brandName['data'].length > 0 ? Object.values(brandName['data']).map((key) => {
          if (key['model_codes'] == null || key['model_codes'] == '') {
            return null;
          }
          return {
            key: key['brand_code'].toLowerCase(),
            value: key['brand_name'],
            image: key['brand_image'] ? key['brand_image'] : ''
          };
        }).filter(item => item !== null) : [],
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
          image : key['body_image'] ? key['body_image'] : ''
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
          brandCode: key['brand_code'].toLowerCase()
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
      // let carVariant = await this.variantListService.startVariantList(request, params);
      // carVariant = {
      //   searchParam: 'carVariant',
      //   searchType: 'eq',
      //   label: custom.lang('Variants'),
      //   values: carVariant['data'].length > 0 ? Object.values(carVariant['data']).map((key) => ({
      //     key: key['variant_code'].toLowerCase(),
      //     value: key['variant_name'],
      //     modelCode: key['model_code']
      //   })) : [],
      // };

      // filter_arr = { ...filter_arr, carVariant };
      if ('filters' in params) {
        delete params['filters']
      }
      let fuelType = {
        searchParam: 'fuel',
        searchType: 'eq',
        label: custom.lang('Fuel Type'),
        values: [
          {
            key: 'petrol',
            value: 'Petrol',
          },
          {
            key: 'diesel',
            value: 'Diesel',
          },
          {
            key: 'hybrid',
            value: 'Hybrid',
          },
          {
            key: 'electric',
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
            key: 'manual',
            value: 'Manual',
          },
          {
            key: 'automatic',
            value: 'Automatic',
          },
        ],
      };
      filter_arr = { ...filter_arr, transmissionType };
      let min_max_filters = await this.carAddService.fetchMinMax()
      const {price , year} = min_max_filters
      let manufactureYear = {
        searchParam: 'year',
        searchType: 'btw',
        label: custom.lang('Year'),
        values: {
          from: year.min_year,
          to: year.max_year,
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
          from: price.min_price,
          to: price.max_price,
        },
        default_values: {
          from: price.min_price,
          to: price.max_price,
        },
      };

      filter_arr = { ...filter_arr, carPrice };

      let sort = {
        "manufactureYear": {
          sortParam: 'year',
          label: custom.lang('Year'),
        },
        "price": {
          sortParam: 'price',
          label: custom.lang('Price'),
        },
        "drivenDistance": {
          sortParam: 'distance',
          label: custom.lang('KM Driven'),
        },
        "newestFirst": {
          sortParam: 'newest',
          label: custom.lang('Newest First'),
        },
        "oldestFirst": {
          sortParam: 'oldest',
          label: custom.lang('Oldest First'),
        }
      }
      filter_arr = { ...filter_arr, sort }
      return filter_arr;
    } catch (err) {
      console.log(err)
    }
  }
  @Post('body-add')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'body_image' },
    ]))
  async BodyAdd(@Req() request: Request, @Body() body: BodyAddDto, @UploadedFiles() files: Record<string, Express.Multer.File[]>) {
    const fileDto = new BodyAddImageFileDto();
    fileDto.body_image = files?.body_image;
    const errors = await validate(fileDto, { whitelist: true });
    await this.carMicroservice.processLookupDataFromBody(body)
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
    return await this.bodyService.startBodyAdd(request, params);
  }

  @Put('body-update')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'body_image' },
    ]))
  async BodyUpdate(@Req() request: Request, @Body() body: BodyUpdateDto, @UploadedFiles() files: Record<string, Express.Multer.File[]>) {
    const fileDto = new BodyUpdateImageFileDto();
    fileDto.body_image = files?.body_image;
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
    let data  = await this.carAddService.fetchBrandModelPresentCar()
    const modelIds = data.map(item => item.carModelId);
    return modelList = {
      settings: modelList['settings'],
      data: modelList['data'].length > 0 ? Object.values(modelList['data'])
      .filter(item => modelIds.includes(item['model_id']))
      .map((key) => ({
        value: key['model_name'],
        key: key['model_code'].toLowerCase(),
      })) : {}
    }
  }

  @Post('customer-wishlist')
  async getCarWishlistAdmin(@Req() request: ExpressRequest, @Body() body: CarListDto, @Query() query: CarWishlistAdminDto,) {
    return await this.carWishlistService.startCarWishlist(request, body, query);
  }

  @Post('car-wishlist')
  async getCarWishlist(@Req() request: ExpressRequest, @Body() body: CarListDto) {
    body['is_front'] = 'Yes';
    return await this.carWishlistService.startCarWishlist(request, body);
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
        'color': 'color',
        'brand': 'brandCode',
        'body': 'bodyType',
        'model': 'modelName',
        'fuel': 'fuel',
        'transmission': 'transmission',
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

  @Post('sell-car')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'attachment' },
    ]))
  async SellCar(@Req() request: Request, @Body() body: SellCarDto, @UploadedFiles() files: Record<string, Express.Multer.File[]>,) {
    const fileDto = new SellCarAddImageDto();
    fileDto.attachment = files?.attachment;
    const errors = await validate(fileDto, { whitelist: true });
    // await this.carMicroservice.processLookupDataFromBody(body)
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
    return await this.sellCarService.sellCar(params);
  }

  @Post('sell-car-list')
  async sellCarList(@Req() request: Request, @Body() body: CarListDto) {
    const params = body;
    return await this.sellCarService.startSellCarList(request, params);
  }

  sort_map_arr(type) {
    try {
      if (typeof type === 'undefined') {
        return {};
      }
      const mapping = {
        'oldest': 'added_date',
        'newest': 'added_date',
        'distance': 'drivenDistance',
        'price': 'price',
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