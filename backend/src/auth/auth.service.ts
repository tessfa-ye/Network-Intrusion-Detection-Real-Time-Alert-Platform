import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await this.usersService.validatePassword(user, password);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.active) {
            throw new UnauthorizedException('Account is disabled');
        }

        await this.usersService.updateLastLogin((user as any)._id.toString());
        return user;
    }

    async login(user: any) {
        const userId = (user as any)._id?.toString() || user.id;
        const payload = {
            email: user.email,
            sub: userId,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
        });

        await this.usersService.updateRefreshToken(userId, refreshToken);

        return {
            accessToken,
            refreshToken,
            user: {
                id: userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        };
    }

    async register(userData: any) {
        const existing = await this.usersService.findByEmail(userData.email);
        if (existing) {
            throw new UnauthorizedException('Email already exists');
        }

        const user = await this.usersService.create({
            ...userData,
            authProvider: 'local',
        });

        return this.login(user);
    }

    async refresh(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const user = await this.usersService.findById(payload.sub);

            if (!user) {
                throw new UnauthorizedException('Invalid token');
            }

            return this.login(user);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: string) {
        await this.usersService.updateRefreshToken(userId, null);
    }
}
