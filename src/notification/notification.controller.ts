import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Notification } from './entities/notification.entity';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('notification')
@UseGuards(AuthGuard)
@ApiTags('Notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Send a new notification' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    return this.notificationService.create(createNotificationDto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read/unread' })
  async markAsRead(
    @Param('id') id: string,
    @Body('isRead') isRead: boolean,
  ): Promise<Notification> {
    return this.notificationService.markAsRead(id, isRead);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  async getNotificationById(@Param('id') id: string): Promise<Notification> {
    return this.notificationService.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  async getAllNotification(): Promise<Notification[]> {
    return this.notificationService.findAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification by ID' })
  async removeNotification(@Param('id') id: string): Promise<void> {
    await this.notificationService.remove(id);
  }
}
