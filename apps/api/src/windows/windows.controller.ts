import { Controller, Get } from '@nestjs/common';
import { WindowsService } from './windows.service';

@Controller('api/windows')
export class WindowsController {
  constructor(private windowsService: WindowsService) {}

  @Get()
  getWindows() {
    return this.windowsService.getWindows();
  }
}
