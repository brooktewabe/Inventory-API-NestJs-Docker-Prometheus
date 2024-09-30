import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async create(createSaleDto:CreateSaleDto ): Promise<Sale> {
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
      .andWhere('EXTRACT(MONTH FROM sale.Date) = :month', { month: currentMonth })
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
      .andWhere('EXTRACT(MONTH FROM sale.Date) = :month', { month: currentMonth })
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
  

  async findOne(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id }, 
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
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
