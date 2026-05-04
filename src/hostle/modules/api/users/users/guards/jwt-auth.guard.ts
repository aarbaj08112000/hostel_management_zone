import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  UnauthorizedException 
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true
    const request = context.switchToHttp().getRequest<Request>();
    
    // Define an array of public routes that don't require JWT validation
    const publicRoutes = ['/users/users-login', '/users/users-signup'];

    // Check if current route matches any public route
    const isPublic = publicRoutes.some(route => request.url.includes(route));
    if (isPublic) {
      return true;
    }

    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException({
        settings: { status: 401, success: 0, message: 'Authorization header is missing' },
        data: {}
      });
    }

    const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
    if (!token) {
      throw new UnauthorizedException({
        settings: { status: 401, success: 0, message: 'Token is missing' },
        data: {}
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.DATA_SECRET || 'secretKey');
      // Attach the decoded token payloads (user_id, email, etc.) to the request explicitly
      (request as any).user = decoded; 
      return true;
    } catch (err) {
      throw new UnauthorizedException({
        settings: { status: 401, success: 0, message: 'Invalid or expired token. Please log in again.' },
        data: {}
      });
    }
  }
}
