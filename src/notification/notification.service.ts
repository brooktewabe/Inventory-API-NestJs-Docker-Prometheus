import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { SaleService } from 'src/sale/sale.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private salesService: SaleService,
  ) {}

  // Cron job to check for credit due notifications every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async checkCreditDueNotifications() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // Adjust this call to include pagination if needed
    const salesResponse = await this.salesService.findAll(1, 500000); // Example: fetching first page with a limit
    const sales = salesResponse.data; // Access the data array

    for (const sale of sales) {
      if (sale.Credit_due) {
        const creditDueDate = new Date(sale.Credit_due);
        if (creditDueDate.toDateString() === today.toDateString()) {
          await this.createAndSendNotification(sale.Full_name, 'today');
        }
      }
    }
  }

  async createAndSendNotification(fullName: string, dueDate: string) {
    const notifData = {
      message: `${fullName}'s credit due ${dueDate}.`,
      priority: 'High',
    };

    const notification = this.notificationRepository.create(notifData);
    await this.notificationRepository.save(notification);
    // console.log(`Notification sent for ${fullName}: ${notifData.message}`);
  }

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find();
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification #${id} not found`);
    }
    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.notificationRepository.preload({
      id,
      ...updateNotificationDto,
    });
    if (!notification) {
      throw new NotFoundException(`Notification #${id} not found`);
    }
    return this.notificationRepository.save(notification);
  }

  async remove(id: string): Promise<void> {
    const result = await this.notificationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Notification #${id} not found`);
    }
  }

  async markAsRead(id: string, isRead: boolean): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.isRead = isRead ? true : true;
    notification.readAt = isRead ? new Date() : null;
    return this.notificationRepository.save(notification);
  }
}