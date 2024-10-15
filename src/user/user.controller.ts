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
  
    const accessToken = await this.jwtService.signAsync(
      { id: user.id, fname: user.fname, lname: user.lname }, 
      { expiresIn: '15m' });
    const refreshToken = await this.jwtService.signAsync(
      { id: user.id }, 
      { expiresIn: '7d' });
  
    // Optionally save refreshToken in DB for user
    await this.userService.update(user.id, { refreshToken });
  
    // Set both tokens as HttpOnly cookies
    response.cookie('jwt', accessToken, { httpOnly: true });
    response.cookie('refreshToken', refreshToken, { httpOnly: true });
  
    return {
      message: 'Login successful',
      accessToken,
      refreshToken, // Also return refreshToken if you want to handle client-side storage
      role: user.role,
      id: user.id
    };
  }
  
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh Access Token' })
  async refreshToken(
    @Body('refreshToken') refreshToken: string, // From client-side or cookies
    @Res({ passthrough: true }) response: ExpressResponse,
  ) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const user = await this.userService.findOne(payload.id);
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      const newAccessToken = await this.jwtService.signAsync(
        { id: user.id, fname: user.fname, lname: user.lname }, 
        { expiresIn: '15m' }
      );
  
      // Set the new access token as a cookie
      response.cookie('jwt', newAccessToken, { httpOnly: true });
  
      return { accessToken: newAccessToken };
    } catch (e) {
      throw new BadRequestException('Invalid refresh token');
    }
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
