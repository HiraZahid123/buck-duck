import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(body: any): Promise<{
        token: string;
        user: any;
    }>;
    login(body: any): Promise<{
        token: string;
        user: any;
    }>;
    getMe(userId: number): Promise<any>;
    updateMe(userId: number, body: any): Promise<{
        user: any;
    }>;
}
