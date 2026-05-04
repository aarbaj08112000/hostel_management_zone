import { Test, TestingModule } from '@nestjs/testing';
import { HostelsService } from './hostels.service';
import { DataSource } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';

// Mock dependencies
const mockDataSource = {
    getRepository: jest.fn().mockReturnThis(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([{ hostel_id: 1, hostel_name: 'Alpha Hostel' }]),
    getOne: jest.fn().mockResolvedValue({ hostel_id: 1, hostel_name: 'Alpha Hostel' }),
};

const mockResponseLibrary = {
    outputResponse: jest.fn().mockImplementation((outputData, funcData) => ({
        success: outputData.settings.success,
        data: outputData.data,
    })),
};

const mockCitGeneralLibrary = {};
const mockModuleService = {};
const mockElasticService = {};

describe('HostelsService', () => {
    let service: HostelsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HostelsService,
                { provide: DataSource, useValue: mockDataSource },
                { provide: CitGeneralLibrary, useValue: mockCitGeneralLibrary },
                { provide: ResponseLibrary, useValue: mockResponseLibrary },
                { provide: ModuleService, useValue: mockModuleService },
                { provide: ElasticService, useValue: mockElasticService },
            ],
        }).compile();

        service = module.get<HostelsService>(HostelsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getHostels', () => {
        it('should return a list of hostels', async () => {
            const inputParams = {};
            const result = await service.getHostels(inputParams);

            expect(result).toBeDefined();
            expect(result.hostles).toBeInstanceOf(Array);
            expect(result.hostles.length).toBeGreaterThan(0);
            expect(mockDataSource.getMany).toHaveBeenCalled();
        });
    });

    describe('getHostelDetails', () => {
        it('should return a single hostel detail successfully', async () => {
            const inputParams = { id: 1 };
            const result = await service.getHostelDetails(inputParams);

            expect(result).toBeDefined();
            expect(result.hostles_details).toBeDefined();
            expect(result.hostles_details.hostel_id).toBe(1);
            expect(mockDataSource.getOne).toHaveBeenCalled();
        });

        it('should throw error if ID is missing', async () => {
            const inputParams = {};
            const result = await service.getHostelDetails(inputParams);

            // Since the try/catch captures the error and sets blockResult success to 0
            // We expect the resulting hostles_details to be undefined or empty
            expect(result.hostles_details).toStrictEqual({});
        });
    });
});
