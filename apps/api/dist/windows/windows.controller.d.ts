import { WindowsService } from './windows.service';
export declare class WindowsController {
    private windowsService;
    constructor(windowsService: WindowsService);
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
