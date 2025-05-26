import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { PaginationService } from 'src/common/pagination.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Stock } from 'src/stock/entities/stock.entity';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
      @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createSaleDto: CreateSaleDto): Promise<Sale> {
    const sale = this.saleRepository.create(createSaleDto);

    try {
      return await this.saleRepository.save(sale);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
  async calculateTotalSum(): Promise<number> {
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.Sale_type != :type', { type: 'Batch Sale'  })
      .select('SUM(sale.Total_amount)', 'total')
      .getRawOne();

    return result.total || 0;
  }

  // Get total amount for the current year
  async getTotalAmountForCurrentYear(): Promise<number> {
    const currentYear = new Date().getFullYear();
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.Total_amount)', 'total')
      .where('sale.Sale_type != :type', { type: 'Batch Sale' })
      .andWhere('EXTRACT(YEAR FROM sale.Date) = :year', { year: currentYear }) // Use andWhere instead of where
      .getRawOne();

    return result.total || 0; // Return 0 if total is null
}

  // Get total amount for the current month
  async getTotalAmountForCurrentMonth(): Promise<number> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.Total_amount)', 'total')
      .where('sale.Sale_type != :type', { type: 'Batch Sale' })
      .andWhere('EXTRACT(YEAR FROM sale.Date) = :year', { year: currentYear })
      .andWhere('EXTRACT(MONTH FROM sale.Date) = :month', {
        month: currentMonth,
      })
      .getRawOne();

    return result.total || 0;
  }

  // Get total amount for the current day
  async getTotalAmountForCurrentDay(): Promise<number> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentDay = new Date().getDate();
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.Total_amount)', 'total')
      .where('sale.Sale_type != :type', { type: 'Batch Sale' })
      .andWhere('EXTRACT(YEAR FROM sale.Date) = :year', { year: currentYear })
      .andWhere('EXTRACT(MONTH FROM sale.Date) = :month', {
        month: currentMonth,
      })
      .andWhere('EXTRACT(DAY FROM sale.Date) = :day', { day: currentDay })
      .getRawOne();

    return result.total || 0;
  }

  async findAll(
    page: number,
    limit: number = 25,
  ): Promise<{ data: Sale[]; total: number }> {
    const [data, total] = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.Sale_type != :type', { type: 'Batch' })
      .orderBy('sale.Date', 'DESC') // Adjust to 'ASC' for ascending order if needed
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  
    return { data, total };
  }

async findSalesOfDay(
  page: number = 1,
  limit: number = 15,
): Promise<{ data: { productId: string; totalSold: number; name: string }[]; total: number }> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const allResults = await this.saleRepository
    .createQueryBuilder('sale')
    .select('sale.Product_id', 'productId')
    .addSelect('SUM(sale.Quantity)', 'totalSold')
    .groupBy('sale.Product_id')
    .where('EXTRACT(YEAR FROM sale.Date) = :year', { year: currentYear })
    .andWhere('EXTRACT(MONTH FROM sale.Date) = :month', { month: currentMonth })
    .andWhere('EXTRACT(DAY FROM sale.Date) = :day', { day: currentDay })
    .andWhere('sale.Sale_type NOT IN (:...excludedTypes)', {
      excludedTypes: ['Batch Sale', 'Batch part','Batch Usage', 'Single Usage'],
    })
    .orderBy('totalSold', 'DESC')
    .getRawMany();

  const total = allResults.length;

  const paginatedResults = allResults.slice((page - 1) * limit, page * limit);
  const productIds = paginatedResults.map((r) => r.productId);

  const stocks = await this.stockRepository.findByIds(productIds);
  const stockMap = new Map(stocks.map((s) => [s.id, s.Name]));

  const data = paginatedResults.map((res) => ({
    productId: res.productId,
    totalSold: parseInt(res.totalSold, 10),
    name: stockMap.get(res.productId) || 'Deleted Product',
  }));

  return { data, total };
}

async findSalesOfMonth(
  page: number = 1,
  limit: number = 15,
): Promise<{ data: { productId: string; totalSold: number; name: string }[]; total: number }> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const allResults = await this.saleRepository
    .createQueryBuilder('sale')
    .select('sale.Product_id', 'productId')
    .addSelect('SUM(sale.Quantity)', 'totalSold')
    .groupBy('sale.Product_id')
    .where('EXTRACT(YEAR FROM sale.Date) = :year', { year: currentYear })
    .andWhere('EXTRACT(MONTH FROM sale.Date) = :month', { month: currentMonth })
    .andWhere('sale.Sale_type NOT IN (:...excludedTypes)', {
      excludedTypes: ['Batch Sale', 'Batch part','Batch Usage', 'Single Usage'],
    })
    .orderBy('totalSold', 'DESC')
    .getRawMany();

  const total = allResults.length;

  const paginatedResults = allResults.slice((page - 1) * limit, page * limit);
  const productIds = paginatedResults.map((r) => r.productId);

  const stocks = await this.stockRepository.findByIds(productIds);
  const stockMap = new Map(stocks.map((s) => [s.id, s.Name]));

  const data = paginatedResults.map((res) => ({
    productId: res.productId,
    totalSold: parseInt(res.totalSold, 10),
    name: stockMap.get(res.productId) || 'Deleted Product',
  }));

  return { data, total };
}

async findSalesOfYear(
  page: number = 1,
  limit: number = 15,
): Promise<{ data: { productId: string; totalSold: number; name: string }[]; total: number }> {
  const now = new Date();
  const currentYear = now.getFullYear();

  const allResults = await this.saleRepository
    .createQueryBuilder('sale')
    .select('sale.Product_id', 'productId')
    .addSelect('SUM(sale.Quantity)', 'totalSold')
    .groupBy('sale.Product_id')
    .where('EXTRACT(YEAR FROM sale.Date) = :year', { year: currentYear })
    .andWhere('sale.Sale_type NOT IN (:...excludedTypes)', {
      excludedTypes: ['Batch Sale', 'Batch part','Batch Usage', 'Single Usage'],
    })
    .orderBy('totalSold', 'DESC')
    .getRawMany();

  const total = allResults.length;

  const paginatedResults = allResults.slice((page - 1) * limit, page * limit);
  const productIds = paginatedResults.map((r) => r.productId);

  const stocks = await this.stockRepository.findByIds(productIds);
  const stockMap = new Map(stocks.map((s) => [s.id, s.Name]));

  const data = paginatedResults.map((res) => ({
    productId: res.productId,
    totalSold: parseInt(res.totalSold, 10),
    name: stockMap.get(res.productId) || 'Deleted Product',
  }));

  return { data, total };
}
  async findAllCredit(
  ): Promise<{ data: Sale[]; total: number }> {
    const [data, total] = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.Sale_type != :type', { type: 'Batch' })
      .orderBy('sale.Date', 'DESC') // Adjust to 'ASC' for ascending order if needed
      .getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({ where: { id } });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async findByFullName(Full_name: string): Promise<Sale[]> {
    const sales = await this.saleRepository.createQueryBuilder('sale')
        .where('LOWER(sale.Full_name) LIKE LOWER(:Full_name)', { Full_name: `%${Full_name}%` })
        .getMany();

    if (!sales.length) {
        throw new NotFoundException('No sales found for this Full Name');
    }
    return sales;
}

  async findByDate(date: Date): Promise<Sale[]> {
    // Format the date to MM-DD-YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${month}-${day}-${year}`; // MM-DD-YYYY format

    const sales = await this.saleRepository
      .createQueryBuilder('sale')
      .where('DATE_FORMAT(sale.Date, "%m-%d-%Y") = :date', {
        date: formattedDate,
      }) // Use DATE_FORMAT for MySQL
      .getMany();

    if (!sales.length)
      throw new NotFoundException('No sales found for this date');
    return sales;
  }
  async calculateTotalSumByReturnReason(reason: string): Promise<number> {
    const currentYear = new Date().getFullYear(); // Get current year

    const result = await this.saleRepository
      .createQueryBuilder('sales')
      .select('SUM(sales.Total_amount)', 'total')
      .where('sales.Return_reason = :reason', { reason })
      .andWhere('EXTRACT(YEAR FROM sales.Date) = :year', { year: currentYear }) // Filter by current year
      .getRawOne();

    return result.total || 0;
  }

  async countSalesAndCredit(): Promise<{ totalCount: number; creditCount: number }> {
    const currentYear = new Date().getFullYear(); // Get current year

    const totalCountResult = await this.saleRepository
      .createQueryBuilder('sales')
      .select('COUNT(*)', 'total')
      .where('sales.Sale_type != :type', { type: 'Batch Sale' })
      .andWhere('EXTRACT(YEAR FROM sales.Date) = :year', { year: currentYear }) // Filter by current year
      .getRawOne();

    const creditCountResult = await this.saleRepository
      .createQueryBuilder('sales')
      .select('COUNT(*)', 'creditCount')
      .where('sales.Sale_type != :type', { type: 'Batch' })
      .andWhere('sales.Credit IS NOT NULL AND sales.Credit != 0')
      .andWhere('EXTRACT(YEAR FROM sales.Date) = :year', { year: currentYear }) // Filter by current year
      .getRawOne();

    return {
      totalCount: parseInt(totalCountResult.total, 10) || 0,
      creditCount: parseInt(creditCountResult.creditCount, 10) || 0,
    };
  }

  async countClientsWithFutureCreditDue(): Promise<number> {
    const currentDate = new Date(); // Get current date

    const result = await this.saleRepository
      .createQueryBuilder('sales')
      .select('COUNT(*)', 'count')
      .where('sales.Credit_due > :currentDate', { currentDate })
      .getRawOne();

    return parseInt(result.count, 10) || 0; // Return 0 if no records found
  }
  async countClientsWithPastCreditDue(): Promise<number> {
    const currentDate = new Date(); // Get current date

    const result = await this.saleRepository
      .createQueryBuilder('sales')
      .select('COUNT(*)', 'count')
      .where('sales.Credit_due < :currentDate', { currentDate })
      .getRawOne();

    return parseInt(result.count, 10) || 0; // Return 0 if no records found
  }
  async update(id: string, updateSaleDto: Partial<Sale>): Promise<Sale> {
    const sale = await this.saleRepository.preload({
      id,
      ...updateSaleDto,
    });
    if (!sale) throw new NotFoundException('Sale not found');

    try {
      return await this.saleRepository.save(sale);
    } catch (error) {
      throw new BadRequestException('Failed to update sale');
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.saleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Sale not found');
  }
}
