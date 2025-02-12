import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { Response as ExpressResponse } from 'express';
import * as bcrypt from 'bcrypt';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileService } from '../common/file.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { AuthGuard } from 'src/guards/auth.guard';

@ApiTags('User')
@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signUp')
  @UseGuards(AuthGuard) // Add AuthGuard to prevent creating a user without authentication 
  @ApiOperation({ summary: 'Sign up' })
  async signUp(@Body() createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userService.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const profile = await this.userService.create({
      ...createUserDto,
    });

    return profile;
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: ExpressResponse,
  ) {
    const user = await this.userService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const jwt = await this.jwtService.signAsync({ id: user.id, fname: user.fname, lname: user.lname });
    response.cookie('jwt', jwt, { httpOnly: true });

    return {
      message: 'Success',
      jwt: jwt,
      role: user.role,
      id: user.id
    };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) response: ExpressResponse) {
    response.clearCookie('jwt');
    response.setHeader('Cache-Control', 'no-store');
    return { message: 'Logout successful' };
  }

  @Delete('user/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete User Account' })
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    const user = await this.userService.findOne(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userService.remove(id);
    return { message: 'User removed successfully' };
  }

  @Patch('change-password')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Change Password' })
  async changePassword(
    @Body() updateUserDto: UpdateUserDto,
    @Body('email') email: string,
  ) {
    const { password: newPassword } = updateUserDto;

    if (!newPassword) {
      throw new BadRequestException('New password is required');
    }

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    updateUserDto.password = hashedPassword;
    await this.userService.update(user.id, updateUserDto);

    return { message: 'Password updated successfully' };
  }


  @Get('user/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.findOne(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Get('users')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers() {
    const users = await this.userService.findAll();
    if (!users || users.length === 0) {
      throw new NotFoundException('No users found');
    }

    return users;
  }
}
