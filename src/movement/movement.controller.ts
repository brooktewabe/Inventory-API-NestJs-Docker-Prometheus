import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { MovementService } from './movement.service';
import { Movement } from './entities/movement.entity';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('movement')
@UseGuards(AuthGuard)
@ApiTags('Movement')
export class MovementController {
  constructor(private readonly movementService: MovementService) {}

  @Post()
  @ApiOperation({ summary: 'Create stock movement' })
  async create(@Body() createMovementDto: CreateMovementDto): Promise<Movement> {
    try {
      return await this.movementService.create(createMovementDto);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all with optional pagination' })
  async findAll(
    @Query('page') pageQuery: string = '1',
    @Query('limit') limitQuery: string = '25',
  ): Promise<{ data: Movement[]; total: number }> {
    const page = parseInt(pageQuery, 10) || 1;
    const limit = parseInt(limitQuery, 10) || 25;

    const result = await this.movementService.findAll(page, limit);

    if (!result.data.length) {
      throw new NotFoundException('No data found');
    }

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific one by ID' })
  async findOne(@Param('id') id: string): Promise<Movement> {
    return this.movementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific one by ID' })
  async update(
    @Param('id') id: string,
    @Body() updateMovementDto: UpdateMovementDto,
  ): Promise<Movement> {
    try {
      return await this.movementService.update(id, updateMovementDto);
    } catch (error) {
      throw new BadRequestException('Failed to update ');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific one by ID' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.movementService.remove(id);
  }
}
