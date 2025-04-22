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
    @Inject()
    protected readonly carMicroService : CarMicroserviceService
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      try{
        const request = context.switchToHttp().getRequest();
        let params = {...request.body,...request.query,...request.params};
        this.carMicroService.processLookupDataFromBody(params);
        return next.handle();
      }catch(err){
        console.log(err)
      }
    }
  }
  