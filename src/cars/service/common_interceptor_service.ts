import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CarMicroserviceService } from './car_microservice.service';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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


    /// time opt 

    
    const params = { ...request.body, ...request.query, ...request.params };
    return from(this.carMicroService.processLookupDataFromBody(params)).pipe(
      switchMap(() => next.handle())
    );
  }
}
