import { PrismaService } from '../prisma/prisma.service';
export declare class WindowsService {
    private prisma;
    constructor(prisma: PrismaService);
    ensureWindows(weeksAhead?: number): Promise<void>;
    getWindows(): Promise<{
        windows: {
            id: number;
            date: string;
            start_time: string;
            end_time: string;
            label: string;
            capacity: number;
            active: boolean;
            booked: number;
            remaining: number;
            cutoff: string;
            open: boolean;
        }[];
    }>;
}
