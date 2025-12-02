import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from './page';
import { renderWithProviders } from '@/test/utils';
import { api } from '@/lib/api';

// Mock the API module

// Mock the chart and alerts components to simplify rendering
vi.mock('@/components/dashboard/activity-chart', () => ({
    ActivityChart: () => <div data-testid="activity-chart" />,
}));
vi.mock('@/components/dashboard/severity-chart', () => ({
    SeverityChart: () => <div data-testid="severity-chart" />,
}));
vi.mock('@/components/dashboard/latest-alerts', () => ({
    LatestAlerts: () => <div data-testid="latest-alerts" />,
}));
vi.mock('@/lib/api', () => ({
    api: {
        get: vi.fn(),
    },
}));

// Mock the socket hook to avoid connection errors during tests
vi.mock('@/hooks/use-socket', () => ({
    useSocket: () => ({
        socket: {
            on: vi.fn(),
            off: vi.fn(),
        },
        isConnected: true,
    }),
}));

// Mock the StatsSkeleton to verify loading state easily
vi.mock('@/components/skeletons/stats-skeleton', () => ({
    default: () => <div data-testid="stats-skeleton">Loading Stats...</div>,
}));

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading skeleton initially', () => {
        // Mock a pending promise to simulate loading
        (api.get as any).mockReturnValue(new Promise(() => { }));

        renderWithProviders(<DashboardPage />);

        expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument();
    });

    it('renders stats after successful fetch', async () => {
        const mockStats = {
            totalAlerts: 150,
            activeEvents: 5,
            systemHealth: '98%',
            activeRules: 12,
            alertsChange: 0,
            eventsChange: 0,
            severityDistribution: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
            },
        };

        (api.get as any).mockResolvedValue({ data: mockStats });

        renderWithProviders(<DashboardPage />);

        // Wait for the stats to appear
        await waitFor(() => {
            expect(screen.getByText('Total Alerts')).toBeInTheDocument();
            expect(screen.getByText('150')).toBeInTheDocument();
            expect(screen.getByText('Active Events')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('System Health')).toBeInTheDocument();
            expect(screen.getByText('98%')).toBeInTheDocument();
        });
    });
});
