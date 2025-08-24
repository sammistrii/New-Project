import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';
import { UserWallet } from './entities/user-wallet.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserWallet)
    private readonly walletRepository: Repository<UserWallet>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['wallet'],
      select: ['id', 'email', 'name', 'role', 'kyc_status', 'created_at'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['wallet'],
      select: ['id', 'email', 'name', 'role', 'kyc_status', 'created_at', 'updated_at'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['wallet'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Only allow updating certain fields
    if (updateUserDto.name !== undefined) {
      user.name = updateUserDto.name;
    }

    if (updateUserDto.kyc_status !== undefined) {
      user.kyc_status = updateUserDto.kyc_status;
    }

    const updatedUser = await this.userRepository.save(user);
    
    // Remove sensitive fields from response
    delete updatedUser.password_hash;
    delete updatedUser.refresh_token;

    return updatedUser;
  }

  async updateRole(id: string, newRole: UserRole): Promise<User> {
    const user = await this.findById(id);

    // Validate role transition
    if (!this.isValidRoleTransition(user.role, newRole)) {
      throw new BadRequestException(`Invalid role transition from ${user.role} to ${newRole}`);
    }

    user.role = newRole;
    const updatedUser = await this.userRepository.save(user);
    
    // Remove sensitive fields from response
    delete updatedUser.password_hash;
    delete updatedUser.refresh_token;

    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async getUserWallet(userId: string): Promise<UserWallet> {
    const wallet = await this.walletRepository.findOne({
      where: { user_id: userId },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet for user ${userId} not found`);
    }

    return wallet;
  }

  async updateWallet(userId: string, updates: Partial<UserWallet>): Promise<UserWallet> {
    const wallet = await this.getUserWallet(userId);
    
    Object.assign(wallet, updates);
    return this.walletRepository.save(wallet);
  }

  async addPoints(userId: string, points: number): Promise<UserWallet> {
    const wallet = await this.getUserWallet(userId);
    wallet.addPoints(points);
    return this.walletRepository.save(wallet);
  }

  async deductPoints(userId: string, points: number): Promise<UserWallet> {
    const wallet = await this.getUserWallet(userId);
    wallet.deductPoints(points);
    return this.walletRepository.save(wallet);
  }

  async lockAmount(userId: string, amount: number): Promise<UserWallet> {
    const wallet = await this.getUserWallet(userId);
    wallet.lockAmount(amount);
    return this.walletRepository.save(wallet);
  }

  async unlockAmount(userId: string, amount: number): Promise<UserWallet> {
    const wallet = await this.getUserWallet(userId);
    wallet.unlockAmount(amount);
    return this.walletRepository.save(wallet);
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
      relations: ['wallet'],
      select: ['id', 'email', 'name', 'role', 'kyc_status', 'created_at'],
    });
  }

  async getUsersStats(): Promise<{
    total: number;
    byRole: Record<UserRole, number>;
    activeToday: number;
  }> {
    const total = await this.userRepository.count();
    
    const byRole: Record<UserRole, number> = {
      [UserRole.TOURIST]: 0,
      [UserRole.MODERATOR]: 0,
      [UserRole.COUNCIL]: 0,
    };

    for (const role of Object.values(UserRole)) {
      byRole[role] = await this.userRepository.count({ where: { role } });
    }

    // Count users created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await this.userRepository.count({
      where: {
        created_at: today,
      },
    });

    return {
      total,
      byRole,
      activeToday,
    };
  }

  private isValidRoleTransition(currentRole: UserRole, newRole: UserRole): boolean {
    // Only allow certain role transitions
    const validTransitions = {
      [UserRole.TOURIST]: [UserRole.MODERATOR], // Tourist can become moderator
      [UserRole.MODERATOR]: [UserRole.COUNCIL], // Moderator can become council
      [UserRole.COUNCIL]: [], // Council is the highest role
    };

    return validTransitions[currentRole]?.includes(newRole) || false;
  }
}