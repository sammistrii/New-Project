import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from '../users/entities/user.entity';
import { UserWallet } from '../users/entities/user-wallet.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserWallet)
    private readonly walletRepository: Repository<UserWallet>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{ user: User; accessToken: string }> {
    const { email, password, name } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      name,
      password_hash: passwordHash,
      role: UserRole.TOURIST,
    });

    const savedUser = await this.userRepository.save(user);

    // Create wallet for user
    const wallet = this.walletRepository.create({
      user_id: savedUser.id,
      points_balance: 0,
      cash_balance: 0,
      locked_amount: 0,
    });

    await this.walletRepository.save(wallet);

    // Generate JWT token
    const accessToken = this.generateAccessToken(savedUser);

    // Remove password from response
    delete savedUser.password_hash;

    return { user: savedUser, accessToken };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; accessToken: string }> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({ 
      where: { email },
      relations: ['wallet'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const accessToken = this.generateAccessToken(user);

    // Remove password from response
    delete user.password_hash;

    return { user, accessToken };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['wallet'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.validateUser(userId);
    const accessToken = this.generateAccessToken(user);
    return { accessToken };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password_hash = newPasswordHash;
    await this.userRepository.save(user);
  }

  async resetPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    // Generate reset token (implement email sending logic here)
    // For now, just log the reset request
    console.log(`Password reset requested for user: ${email}`);
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}