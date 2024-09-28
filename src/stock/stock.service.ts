import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Stock } from './entities/stock.entity';
import { PaginationService } from 'src/common/pagination.service';
import { FileService } from '../common/file.service';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,

    private readonly paginationService: PaginationService,
    private readonly fileService: FileService,
  ) {}

  async create(createStockDto: CreateStockDto, file?: Express.Multer.File): Promise<Stock> {
    try {
      if (file) {
        const filePath = this.fileService.saveFile(file, 'stock-images');
        const uniqueFileName = filePath.split('/').pop();
        createStockDto.Product_image = uniqueFileName;
      }

      const stock = this.stockRepository.create(createStockDto);
      return await this.stockRepository.save(stock);
    } catch (error) {
      throw new BadRequestException('Failed to create stock');
    }
  }

  async findAll(page: number, limit: number = 25): Promise<{ data: Stock[]; total: number }> {
    const [data, total] = await this.stockRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: { id },
    });

    if (!stock) throw new NotFoundException('Stock not found');

    return stock;
  }

  async update(id: string, updateStockDto: UpdateStockDto, file?: Express.Multer.File): Promise<Stock> {
    const stock = await this.stockRepository.preload({
      id,
      ...updateStockDto,
    });

    if (!stock) throw new NotFoundException('Stock not found');

    if (file) {
      const filePath = this.fileService.saveFile(file, 'stock-images');
      const uniqueFileName = filePath.split('/').pop();
      stock.Product_image = uniqueFileName;
    }

    try {
      return await this.stockRepository.save(stock);
    } catch (error) {
      throw new BadRequestException('Failed to update stock');
    }
  }
  async calculateTotalSum(): Promise<number> {
    const result = await this.stockRepository
      .createQueryBuilder('stock')
      .select('SUM(stock.Price * stock.Curent_stock)', 'total')
      .getRawOne();
  
    return result.total || 0;
  }
  
  async remove(id: string): Promise<void> {
    const result = await this.stockRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Stock not found');
  }
}
