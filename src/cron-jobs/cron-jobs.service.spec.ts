import { Test, TestingModule } from '@nestjs/testing';
import { CronJobsService } from './cron-jobs.service';
import { PrismaService } from '../prisma.service';

describe('CronJobsService', () => {
  let service: CronJobsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobsService,
        {
          provide: PrismaService,
          useValue: {
            cuota: {
              findFirst: jest.fn(),
            },
            family: {
              findMany: jest.fn(),
            },
            balance: {
              update: jest.fn(),
            },
            transactions: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CronJobsService>(CronJobsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get cron job status', () => {
    const status = service.getCronJobStatus();
    expect(status).toHaveProperty('isRunning');
    expect(status).toHaveProperty('nextRun');
  });

  it('should handle manual monthly update', async () => {
    // Mock cuota activa
    const mockCuota = {
      id: '1',
      value: 5000,
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock familias
    const mockFamilies = [
      {
        id: '1',
        id_balance: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Familia Test',
        phone: '123456789',
        manage_by: 'Admin',
        balance: {
          id: '1',
          value: 10000,
          is_custom_cuota: false,
          custom_cuota: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          cfa_balance_value: 0,
          custom_cfa_value: 0,
          is_custom_cfa: false,
        },
      },
    ];

    jest.spyOn(prismaService.cuota, 'findFirst').mockResolvedValue(mockCuota);
    jest.spyOn(prismaService.family, 'findMany').mockResolvedValue(mockFamilies);
    jest.spyOn(prismaService.balance, 'update').mockResolvedValue({} as any);
    jest.spyOn(prismaService.transactions, 'create').mockResolvedValue({} as any);

    await expect(service.runMonthlyUpdateManually()).resolves.not.toThrow();
  });

  it('should handle case when no active cuota exists', async () => {
    jest.spyOn(prismaService.cuota, 'findFirst').mockResolvedValue(null);

    await expect(service.runMonthlyUpdateManually()).resolves.not.toThrow();
  });

  it('should handle case when no families exist', async () => {
    const mockCuota = {
      id: '1',
      value: 5000,
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(prismaService.cuota, 'findFirst').mockResolvedValue(mockCuota);
    jest.spyOn(prismaService.family, 'findMany').mockResolvedValue([]);

    await expect(service.runMonthlyUpdateManually()).resolves.not.toThrow();
  });
});
