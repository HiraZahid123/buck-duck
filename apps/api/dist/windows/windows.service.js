"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WindowsService = class WindowsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureWindows(weeksAhead = 4) {
        const slots = [
            ['06:00', '12:00', 'Morning · 6 AM – 12 PM'],
            ['12:00', '16:00', 'Afternoon · 12 PM – 4 PM'],
        ];
        const now = new Date();
        const day = now.getDay();
        const daysUntilSaturday = (6 - day + 7) % 7;
        const nextSat = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSaturday);
        for (let i = 0; i < weeksAhead; i++) {
            const d = new Date(nextSat);
            d.setDate(d.getDate() + i * 7);
            const dateStr = d.toISOString().split('T')[0];
            for (const [start, end, label] of slots) {
                const existing = await this.prisma.deliveryWindow.findUnique({
                    where: { date_startTime: { date: dateStr, startTime: start } },
                });
                if (!existing) {
                    await this.prisma.deliveryWindow.create({
                        data: {
                            date: dateStr,
                            startTime: start,
                            endTime: end,
                            label,
                            capacity: 120,
                            active: true,
                        },
                    });
                }
            }
        }
    }
    async getWindows() {
        await this.ensureWindows();
        const todayStr = new Date().toISOString().split('T')[0];
        const windows = await this.prisma.deliveryWindow.findMany({
            where: {
                date: { gte: todayStr },
                active: true,
            },
            include: {
                _count: {
                    select: {
                        orders: {
                            where: {
                                status: { notIn: ['cancelled', 'refunded', 'pending_payment'] },
                            },
                        },
                    },
                },
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });
        const now = new Date();
        const cutoffHours = 24;
        return {
            windows: windows.map((w) => {
                const windowStartTime = new Date(`${w.date}T${w.startTime}:00`);
                const cutoffTime = new Date(windowStartTime.getTime() - cutoffHours * 3600 * 1000);
                const booked = w._count.orders;
                const remaining = Math.max(0, w.capacity - booked);
                const isOpen = now < cutoffTime && remaining > 0 && w.active;
                return {
                    id: w.id,
                    date: w.date,
                    start_time: w.startTime,
                    end_time: w.endTime,
                    label: w.label,
                    capacity: w.capacity,
                    active: w.active,
                    booked,
                    remaining,
                    cutoff: cutoffTime.toISOString(),
                    open: isOpen,
                };
            }),
        };
    }
};
exports.WindowsService = WindowsService;
exports.WindowsService = WindowsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WindowsService);
//# sourceMappingURL=windows.service.js.map