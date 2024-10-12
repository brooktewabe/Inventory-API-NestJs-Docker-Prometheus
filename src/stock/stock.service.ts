import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Stock } from './entities/stock.entity';
import { PaginationService } from 'src/common/pagination.service';
import { FileService } from '../common/file.service';
import { CreateNotificationDto } from 'src/notification/dto/create-notification.dto';
import { CreateMovementDto } from 'src/movement/dto/create-movement.dto';
import { MovementService } from 'src/movement/movement.service';
import { NotificationService } from 'src/notification/notification.service';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly paginationService: PaginationService,
    private readonly fileService: FileService,
    private readonly movementService: MovementService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
  ) {}

  async create(
    createStockDto: CreateStockDto,
    file?: Express.Multer.File,
  ): Promise<Stock> {
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

  async findAll(
    page: number,
    limit: number = 25,
  ): Promise<{ data: Stock[]; total: number }> {
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

  async update(
    id: string,
    updateStockDto: UpdateStockDto,
    user: User,
    file?: Express.Multer.File,
  ): Promise<Stock> {
    // const stock = await this.stockRepository.preload({id,...updateStockDto});
    
    const stock = await this.stockRepository.findOne({ where: { id } });
    if (!stock) throw new NotFoundException('Stock not found');
    const newStock = updateStockDto.Curent_stock;

    const oldStock = stock.Curent_stock;
    const adjustment = newStock - oldStock;
    Object.assign(stock, updateStockDto);

    if (!stock) throw new NotFoundException('Stock not found');

    if (file) {
      const filePath = this.fileService.saveFile(file, 'stock-images');
      const uniqueFileName = filePath.split('/').pop();
      stock.Product_image = uniqueFileName;
    }

    try {
      // Create movement record
      const movementData: CreateMovementDto = {
        User: `${user.fname} ${user.lname}`,
        Name: stock.Name,
        Adjustment: adjustment,
        Type: 'Modification',
        Product_id: stock.id,
        Date: undefined,
      };
      await this.movementService.create(movementData);

      // If the stock is below reorder level, send a notification
      if (updateStockDto.Curent_stock < updateStockDto.Reorder_level) {
        const notificationData: CreateNotificationDto = {
          message: `${updateStockDto.Name} is running low on stock.`,
          priority: 'High',
        };
        await this.notificationService.create(notificationData);
      }
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
