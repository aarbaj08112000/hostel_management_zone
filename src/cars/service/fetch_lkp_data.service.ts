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
    async getLkpData(inputParams) {
        try {
            const page = Number(inputParams.page) || 1;
            const limit = Number(inputParams.limit) || 10;
            const offset = (page - 1) * limit;
            // const data = await this.lookupEntity.createQueryBuilder('lookup').getMany();
            const queryBuilder = this.lookupEntity
                .createQueryBuilder('lookup')
                .skip(offset)
                .take(limit);
            if (Array.isArray(inputParams.sort)) {
                for (const sortItem of inputParams.sort) {
                    if (sortItem.prop && ['asc', 'desc'].includes(sortItem.dir.toLowerCase())) {
                        queryBuilder.addOrderBy(`lookup.${sortItem.prop}`, sortItem.dir.toUpperCase() as 'ASC' | 'DESC');
                    }
                }
            }
            const [data, total] = await queryBuilder.getManyAndCount();
            if (!data.length) {
                throw new Error('No lookup data found.');
            }
            const totalPages = Math.ceil(total / limit);
            const currPage = page;
            const lastPage = totalPages;
            const prevPage = currPage > 1 ? true : false;
            const nextPage = currPage < totalPages ? true : false;

            return {
                settings: {
                    status: 200,
                    success: 1,
                    message: 'Lookup data found.',
                    count: total,
                    per_page: limit,
                    curr_page: currPage,
                    last_page: lastPage,
                    prev_page: prevPage,
                    next_page: nextPage,
                },
                data,
            };
        } catch (err) {
            console.log(err);
            return {
                "settings": {
                    "status": 200,
                    "success": 0,
                    "message": err.message || 'Error in fetching data.'
                },
                "data": {}
            }
        }
    }
}
