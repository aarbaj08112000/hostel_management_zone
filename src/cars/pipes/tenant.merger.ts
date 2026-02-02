import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { EncryptService } from '@repo/source/services/encrypt.service';
import { TenantContext } from "./tenant.content";
@Injectable()
export class TenantMergeInterceptor implements NestInterceptor {
  constructor(
    private readonly encryptService: EncryptService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    if (context.getType() === 'rpc') {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest();
    const method = req.method.toUpperCase();
    const cookieString = req.headers['cookie'] || "";
    let parts: Record<string, string> = {};

    try {
      parts = Object.fromEntries(
        cookieString
          .split(";")
          .map(p => p.trim().split("="))
          .filter(p => p.length === 2)
      );
    } catch (e) {
      parts = {};
    }
    const companyIdHeader = req.headers['x-company-id'] || parts['x-company-id'] || null;
    const adminIdHeader   = req.headers['x-client-id'] || parts['x-client-id'] || null;
    const groupCodeHeader = req.headers['x-role-code'] || parts['x-role-code'] || null;
    const teamIdHeader    = req.headers['x-team-id'] || parts['x-team-id'] || null;

  
    let companyId = Array.isArray(companyIdHeader) ? companyIdHeader[0] : companyIdHeader;
    let adminId   = Array.isArray(adminIdHeader) ? adminIdHeader[0] : adminIdHeader;
    let groupCode = Array.isArray(groupCodeHeader) ? groupCodeHeader[0] : groupCodeHeader;
    let teamId    = Array.isArray(teamIdHeader) ? teamIdHeader[0] : teamIdHeader;

    if (companyId) {
      companyId = await this.encryptService.decryptContent(companyId);
    }

    if (adminId) {
      adminId = await this.encryptService.decryptContent(adminId);
    }

    if (groupCode) {
      groupCode = await this.encryptService.decryptContent(groupCode);
    }

    if (teamId) {
      teamId = await this.encryptService.decryptContent(teamId);
    }
    const isBodyMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    const tenantData = {
      ...(companyId ? { x_account_id: String(companyId) } : {}),
      ...(adminId   ? { x_admin_id: String(adminId) }   : {}),
      ...(groupCode ? { x_group_code: groupCode }       : {}),
      ...(teamId    ? { x_team_id: String(teamId) }     : {}),
    };

    if (isBodyMethod) {
      req.body = { ...req.body, ...tenantData };
    } else if (method === "GET") {
      req.query = {
        ...req.query,
        ...(companyId ? { x_account_id: String(companyId) } : {}),
        ...(adminId   ? { x_admin_id: String(adminId) }   : {}),
        ...(groupCode ? { x_group_code: String(groupCode) } : {}),
        ...(teamId    ? { x_team_id: String(teamId) }       : {}),
      };
    }
    return TenantContext.run(
        {
            companyId: companyId?.toString(),
            adminId: adminId?.toString(),
            groupCode,
            teamId,
        },
        () => next.handle(), 
        );
  }
}
