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
    private readonly paginationService: PaginationService,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>, // Inject Stock repository
  ) {}

  async create(createSaleDto: CreateSaleDto): Promise<Sale> {
    const stock = await this.stockRepository.findOne({
      where: { id: createSaleDto.Product_id }, // Get the stock by Product_id
    });

    if (!stock) {
      throw new BadRequestException('Product not found');
    }

    const sale = this.saleRepository.create({
      ...createSaleDto,
      Product: stock, // Assign the related product
    });

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
        Date: 'DESC',
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
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
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
