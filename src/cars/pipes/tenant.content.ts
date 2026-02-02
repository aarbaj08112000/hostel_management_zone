import { AsyncLocalStorage } from 'async_hooks';

export type TenantData = {
  companyId?: string;
  adminId?: string;
  groupCode?: string;
  teamId?: string;
};

const tenantStorage = new AsyncLocalStorage<TenantData>();

export class TenantContext {
  static run(data: TenantData, fn: () => any) {
    return tenantStorage.run(data, fn);
  }

  static get(): TenantData | undefined {
    return tenantStorage.getStore();
  }

  static companyId(): string | undefined {
    return tenantStorage.getStore()?.companyId;
  }

  static adminId(): string | undefined {
    return tenantStorage.getStore()?.adminId;
  }

  static groupCode(): string | undefined {
    return tenantStorage.getStore()?.groupCode;
  }

  static teamId(): string | undefined {
    return tenantStorage.getStore()?.teamId;
  }
}
