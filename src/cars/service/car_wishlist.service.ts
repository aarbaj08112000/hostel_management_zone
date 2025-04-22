import { Injectable, Inject, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { Repository, DataSource, In } from 'typeorm';
import { Request } from 'express';
import { CarWishlistEntity } from '../entities/cars.entity';
// import { CustomerEntity } from '../entities/customer.entity';
import { LookupEntity } from '@repo/source/entities/lookup.entity';
import { CarEntity } from '../entities/cars.entity';
import { CarDetailsEntity } from '../entities/cars-detail.entity';
import { BodyEntity } from '../entities/body.entity';
import { ElasticService } from '@repo/source/services/elastic.service';
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';
import _ from 'lodash';

@Injectable()
export class CarWishlistService {
  private keycloakUrl: string;
  private keycloakRealm: string;

  @InjectDataSource()
  private readonly dataSource: DataSource;

  constructor(
    protected readonly elasticService: ElasticService,
    private readonly general: CitGeneralLibrary,
    private readonly configService: ConfigService,
    @InjectRepository(CarWishlistEntity)
    private readonly carWishlistRepo: Repository<CarWishlistEntity>,
    @InjectRepository(LookupEntity)
    private readonly modCustomerRepo: Repository<LookupEntity>,
    @InjectRepository(CarEntity)
    private readonly carRepo: Repository<CarEntity>,
    @InjectRepository(CarDetailsEntity)
    private readonly carDetailsRepo: Repository<CarDetailsEntity>,
    @InjectRepository(BodyEntity)
    private readonly bodyRepo: Repository<BodyEntity>,
  ) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_BASE_URL');
    this.keycloakRealm = this.configService.get<string>('KEYCLOAK_REALM');
  }

  private async getUserFromAccessToken(request: Request) {
    const accessToken = request.cookies['front-access-token'];
    if (!accessToken) {
      throw new UnauthorizedException('Access token not found in cookies');
    }

    const userInfoUrl = `${this.keycloakUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/userinfo`;
    const headers = { Authorization: `Bearer ${accessToken}` };

    const userInfoResponse = await this.general.callThirdPartyApi('GET', userInfoUrl, '', headers);
    const userInfo = userInfoResponse.data;

    if (!userInfo?.email) {
      throw new UnauthorizedException('Invalid access token.');
    }

    // const user = await this.modCustomerRepo.findOne({ where: { phoneNumber: userInfo.preferred_username } });
    const user = await this.modCustomerRepo
    .createQueryBuilder('mod_customer')
    .where("JSON_UNQUOTE(JSON_EXTRACT(mod_customer.entityJson, '$.phoneNumber')) = :phoneNumber", {
      phoneNumber: userInfo.preferred_username,
    }).andWhere("mod_customer.entityName = :entityName", {
      entityName: 'customer', 
    })
    .getOne();
    if (!user) {
      throw new UnauthorizedException('User not found in the system.');
    }

    return user;
  }

  async addToWishlist(request: Request, inputParams: { car_slug: string }) {
    try {
      const user = await this.getUserFromAccessToken(request);

      const carData = await this.carRepo.findOne({
        where: { slug: inputParams.car_slug },
      });

      if (!carData) {
        throw new NotFoundException('Car not found.');
      }

      const existingEntry = await this.carWishlistRepo.findOne({
        where: { carId: carData.carId, userId: user.entityId },
      });

      if (existingEntry) {
        throw new ConflictException('Car is already in your wishlist.');
      }

      const wishlistEntry = this.carWishlistRepo.create({
        carId: carData.carId,
        userId: user.entityId,
      });

      await this.carWishlistRepo.save(wishlistEntry);
      return { success: 1, message: 'Car added to your wishlist.' };
    } catch (err) {
      return { success: 0, message: err.message, data: [] };
    }
  }

  async removeFromWishlist(request: Request, inputParams: { car_slug: string }) {
    try {
      const user = await this.getUserFromAccessToken(request);

      const carData = await this.carRepo.findOne({
        where: { slug: inputParams.car_slug },
      });

      if (!carData) {
        throw new NotFoundException('Car not found.');
      }

      const existingEntry = await this.carWishlistRepo.findOne({
        where: { carId: carData.carId, userId: user.entityId},
      });

      if (!existingEntry) {
        throw new NotFoundException('Car is not in your wishlist.');
      }

      await this.carWishlistRepo.delete({ carId: carData.carId, userId: user.entityId });

      return { success: 1, message: 'Car removed from your wishlist.' };
    } catch (err) {
      return { success: 0, message: err.message, data: [] };
    }
  }

  async getWishlist(request: Request) {
    try {
      const user = await this.getUserFromAccessToken(request);

      // Fetch wishlist entries using the userId
      const wishlistEntries = await this.carWishlistRepo.find({
        where: { userId: user.entityId},
      });

      if (!wishlistEntries.length) {
        throw new NotFoundException('No cars found in your wishlist.');
      }

      const carIds = wishlistEntries.map(entry => entry.carId);

      const cars = await this.carRepo.find({
        where: { carId: In(carIds) },
      });

      const carDetails = await this.carDetailsRepo.find({
        where: { carId: In(carIds) },
      });

      const bodyTypes = await this.bodyRepo.find({
        where: { bodyTypeId: In(carDetails.map(detail => detail.bodyTypeid)) },
      });

      const bodyTypesMap: { [key: number]: any } = {};
      bodyTypes.forEach(body => {
        bodyTypesMap[body.bodyTypeId] = body;
      });

      const carDetailsMap: { [key: number]: CarDetailsEntity } = {};
      carDetails.forEach(detail => {
        carDetailsMap[detail.carId] = detail;
      });

      const aws_folder = await this.general.getConfigItem('AWS_SERVER');
      let fileConfig: FileFetchDto = {};
      fileConfig.source = 'amazon';
      fileConfig.extensions = await this.general.getConfigItem('allowed_extensions');

      const wishlistDetails = await Promise.all(
        cars.map(async (car) => {
          const details = carDetailsMap[car.carId] ?? {};
          const bodyType = bodyTypesMap[details['bodyTypeid']] ?? {};

          fileConfig.path = `car_images_${aws_folder}/${car.carId}`;
          fileConfig.image_name = car.carImage;
          const carImageUrl = await this.general.getFile(fileConfig, {});

          let addedDate = this.general.timeAgo(car.addedDate);
          let price = this.general.numberFormat(car.price, 'currency');
          let currency_code = await this.general.getConfigItem('ADMIN_CURRENCY_PREFIX');

          details['drivenDistance'] = this.general.numberFormat(details['drivenDistance'], 'numerical');

          return {
            carId: car.carId,
            carSlug: car.slug,
            carName: car.carName,
            carImage: carImageUrl,
            price: price,
            currency_code: currency_code,
            added_date: addedDate,
            fuelType: details['fuelType'] ?? null,
            drivenDistance: details['drivenDistance'] ?? null,
            distanceSuffix: 'km',
            transmissionType: details['transmissionType'] ?? null,
            bodyType: bodyType.bodyType ?? null,
            bodyCode: bodyType.bodyCode ?? null,
          };
        })
      );

      return { success: 1, message: 'Wishlist found.', data: wishlistDetails };
    } catch (err) {
      return { success: 0, message: err.message, data: [] };
    }
  }
}
