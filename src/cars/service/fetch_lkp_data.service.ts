interface AuthObject { user: any; }
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LookupEntity } from '@repo/source/entities/lookup.entity';
import * as _ from 'lodash';
@Injectable()
export class GetLookupData {
    constructor(
        @InjectRepository(LookupEntity)
        private readonly lookupEntity: Repository<LookupEntity>,
    ) {}
    async getLkpData() {
        try {
            const data = await this.lookupEntity.createQueryBuilder('lookup').getMany();
            if (!data?.length) {
                throw new Error ('No records found.');
            }
            return {
                success : 1,
                message : 'Record(s) found.',
                data : data
            }
        } catch (err) {
            return {
                success : 0,
                message : err.message || 'Error fetching data.'
            }
        }
    }
}
