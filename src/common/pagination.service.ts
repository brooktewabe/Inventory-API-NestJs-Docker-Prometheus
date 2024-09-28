import { Injectable } from '@nestjs/common';
import { Repository, FindManyOptions } from 'typeorm';

@Injectable()
export class PaginationService {
  async paginate<T>(
    repository: Repository<T>,
    page: number = 1,
    limit: number = 25,
    options: FindManyOptions<T> = {},
  ): Promise<{ data: T[]; total: number }> {
    const [data, total] = await repository.findAndCount({
      ...options,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
    };
  }
}
