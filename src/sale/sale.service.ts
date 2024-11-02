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

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
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
      .where('EXTRACT(YEAR FROM sale.Date) = :year', { year: currentYear })
      .getRawOne();

    return result.total || 0;
  }

  // Get total amount for the current month
  async getTotalAmountForCurrentMonth(): Promise<number> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.Total_amount)', 'total')
      .where('EXTRACT(YEAR FROM sale.Date) = :year', { year: currentYear })
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
      .where('EXTRACT(YEAR FROM sale.Date) = :year', { year: currentYear })
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
    const [data, total] = await this.saleRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        Date: 'DESC', // or 'ASC' for ascending order
      },
    });

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
      .where('EXTRACT(YEAR FROM sales.Date) = :year', { year: currentYear }) // Filter by current year
      .getRawOne();

    const creditCountResult = await this.saleRepository
      .createQueryBuilder('sales')
      .select('COUNT(*)', 'creditCount')
      .where('sales.Credit IS NOT NULL AND sales.Credit != 0')
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
