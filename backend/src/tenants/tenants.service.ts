import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) {}

    /**
     * Self-service tenant registration: creates the org + first admin user
     */
    async register(data: {
        name: string;
        slug: string;
        adminEmail: string;
        adminPassword: string;
        adminFirstName: string;
        adminLastName: string;
    }) {
        // Check slug uniqueness
        const existing = await this.prisma.tenant.findUnique({ where: { slug: data.slug } });
        if (existing) {
            throw new ConflictException('Organization slug already taken');
        }

        // Check email uniqueness
        const existingUser = await this.prisma.user.findUnique({ where: { email: data.adminEmail.toLowerCase() } });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Create tenant + admin user in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: data.name,
                    slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                },
            });

            const passwordHash = await bcrypt.hash(data.adminPassword, 10);

            const adminUser = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    email: data.adminEmail.toLowerCase(),
                    passwordHash,
                    role: 'ADMIN',
                    firstName: data.adminFirstName,
                    lastName: data.adminLastName,
                    authProvider: 'local',
                },
            });

            return {
                tenant: {
                    id: tenant.id,
                    name: tenant.name,
                    slug: tenant.slug,
                    apiKey: tenant.apiKey,
                    plan: tenant.plan,
                },
                admin: {
                    id: adminUser.id,
                    email: adminUser.email,
                    firstName: adminUser.firstName,
                    lastName: adminUser.lastName,
                    role: adminUser.role,
                },
            };
        });

        return result;
    }

    /**
     * Get tenant profile by ID
     */
    async findById(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                logo: true,
                primaryColor: true,
                secondaryColor: true,
                notificationConfig: true,
                active: true,
                createdAt: true,
                _count: {
                    select: {
                        users: true,
                        events: true,
                        alerts: true,
                        rules: true,
                    },
                },
            },
        });

        if (!tenant) throw new NotFoundException('Tenant not found');
        return tenant;
    }

    /**
     * Update tenant branding / settings
     */
    async update(tenantId: string, data: {
        name?: string;
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
        notificationConfig?: any;
    }) {
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data,
            select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                logo: true,
                primaryColor: true,
                secondaryColor: true,
                notificationConfig: true,
            },
        });
    }

    /**
     * Regenerate API key
     */
    async regenerateApiKey(tenantId: string) {
        const tenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                apiKey: crypto.randomUUID(),
            },
            select: {
                id: true,
                apiKey: true,
            },
        });
        return tenant;
    }

    /**
     * Get API key for a tenant (masked)
     */
    async getApiKey(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { apiKey: true },
        });
        if (!tenant) throw new NotFoundException('Tenant not found');

        const key = tenant.apiKey;
        const masked = key.substring(0, 8) + '...' + key.substring(key.length - 4);
        return { apiKey: key, maskedKey: masked };
    }
}
