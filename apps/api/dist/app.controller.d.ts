import { WindowsService } from './windows/windows.service';
export declare class AppController {
    private windowsService;
    constructor(windowsService: WindowsService);
    getConfig(): Promise<{
        brand: string;
        marketplace: string;
        pilot_zone: string;
        demo: boolean;
        delivery_weekday: number;
        delivery_fee_cents: number;
        service_fee_rate: number;
        min_order_cents: number;
        next_window: {
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
        };
        payments: {
            mode: string;
            publishableKey: string;
            country: string;
            currency: string;
        };
    }>;
    getHealth(): {
        ok: boolean;
        timestamp: string;
    };
}
