import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        const user = await this.authService.validateUser(body.email, body.password);
        return this.authService.login(user);
    }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body);
    }

    @Post('refresh')
    async refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refresh(refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Request() req) {
        await this.authService.logout(req.user.userId);
        return { message: 'Logged out successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req) {
        return req.user;
    }
}
