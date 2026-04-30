/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(userData: any): Promise<User> {
    const password = userData.password || userData.passwordHash;
    const data = { ...userData };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
      delete data.password;
    }

    return this.prisma.user.create({
      data,
    });
  }

  async findAll(): Promise<Omit<User, 'passwordHash' | 'refreshToken'>[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        authProvider: true,
        providerId: true,
        notificationPreferences: true,
        active: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(
    id: string,
  ): Promise<Omit<User, 'passwordHash' | 'refreshToken'> | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        authProvider: true,
        providerId: true,
        notificationPreferences: true,
        active: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { authProvider: provider, providerId },
    });
  }

  async update(
    id: string,
    updateData: any,
  ): Promise<Omit<User, 'passwordHash' | 'refreshToken'> | null> {
    const data = { ...updateData };
    const password = data.password || data.passwordHash;
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
      delete data.password;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        authProvider: true,
        providerId: true,
        notificationPreferences: true,
        active: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
