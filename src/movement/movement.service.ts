import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movement } from './entities/movement.entity';
import { PaginationService } from 'src/common/pagination.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class MovementService {
  constructor(
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createMovementDto:CreateMovementDto ): Promise<Movement> {
    const movement = this.movementRepository.create(createMovementDto);

    try {
      return await this.movementRepository.save(movement);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findAll(
    page: number,
    limit: number = 100,
  ): Promise<{ data: Movement[]; total: number }> {
    const [data, total] = await this.movementRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        Date: 'DESC', 
      },
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Movement> {
    const movement = await this.movementRepository.findOne({
      where: { id }, 
    });
    if (!movement) throw new NotFoundException('Not found');
    return movement;
  }

  async update(id: string, updateMovementDto: Partial<Movement>): Promise<Movement> {
    const movement = await this.movementRepository.preload({
      id,
      ...updateMovementDto,
    });
    if (!movement) throw new NotFoundException('Not found');

    try {
      return await this.movementRepository.save(movement);
    } catch (error) {
      throw new BadRequestException('Failed to update Movement');
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.movementRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Movement not found');
  }
}
