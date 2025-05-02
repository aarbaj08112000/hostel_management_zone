import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CarMicroserviceService } from './car_microservice.service';

@Injectable()
export class CommonInterceptor implements NestInterceptor {
  constructor(
    @Inject(CarMicroserviceService)
    protected readonly carMicroService: CarMicroserviceService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const method = request.method; // GET, POST, etc.
    const path = request.route?.path || request.url; // fallback to URL if route missing

    // Skip for specific POST paths
    const skipPaths = ['/cars-add', '/brand-add', '/body-add'];
    if (method === 'POST' && skipPaths.includes(path)) {
      return next.handle();
    }

    try {
      const params = { ...request.body, ...request.query, ...request.params };
      this.carMicroService.processLookupDataFromBody(params);
    } catch (err) {
      console.log(err);
    }

    return next.handle();
  }
}
