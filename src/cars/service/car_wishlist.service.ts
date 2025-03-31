import { Injectable, Inject, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { Repository, DataSource } from 'typeorm';
import { Request } from 'express';
import { CarWishlistEntity } from '../entities/cars.entity';
import { CustomerEntity } from '@repo/source/entities/customer.entity';
import { CarEntity } from '../entities/cars.entity';

@Injectable()
export class CarWishlistService {
  private keycloakUrl: string;
  private keycloakRealm: string;

  @InjectDataSource()
  private readonly dataSource: DataSource;

  constructor(
    private readonly general: CitGeneralLibrary,
    private readonly configService: ConfigService,
    @InjectRepository(CarWishlistEntity)
    private readonly carWishlistRepo: Repository<CarWishlistEntity>,
    @InjectRepository(CustomerEntity)
    private readonly modCustomerRepo: Repository<CustomerEntity>,
    @InjectRepository(CarEntity)
    private readonly carRepo: Repository<CarEntity>,
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

    const user = await this.modCustomerRepo.findOne({ where: { phoneNumber: userInfo.preferred_username } });
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

      const existingEntry = await this.carWishlistRepo.findOne({
        where: { carId: carData.carId, userId: user.id },
      });

      if (existingEntry) {
        throw new ConflictException('Added to your wishlist.');
      }

      const wishlistEntry = this.carWishlistRepo.create({
        carId: carData.carId,
        userId: user.id,
      });

      await this.carWishlistRepo.save(wishlistEntry);
      return { success: 1, message: 'Added to your wishlist.' };
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

      const existingEntry = await this.carWishlistRepo.findOne({
        where: { carId: carData.carId, userId: user.id },
      });

      if (!existingEntry) {
        throw new NotFoundException('Removed from your wishlist.');
      }

      await this.carWishlistRepo.delete({ carId: carData.carId, userId: user.id });

      return { success: 1, message: 'Removed from your wishlist.' };
    } catch (err) {
      return { success: 0, message: err.message, data: [] };
    }
  }
}
