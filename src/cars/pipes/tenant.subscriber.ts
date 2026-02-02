import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm';
import { TenantContext } from './tenant.content';

@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface<any> {

  beforeInsert(event: InsertEvent<any>) {
    this.attachTenant(event.entity);
  }

  beforeUpdate(event: UpdateEvent<any>) {
    if (event.entity) this.attachTenant(event.entity, true);
  }

  private attachTenant(entity: any, isUpdate = false) {
    if (!entity) return;
    const tenant = TenantContext.get();
    if (!tenant) return;
    if (!entity.companyId) {
      entity.companyId = tenant.companyId;
    }
  }
}
