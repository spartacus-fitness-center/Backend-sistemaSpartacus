import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  // Hols
  @Get('health')
  async getHealth(): Promise<string> {
    return "API is healthy"
  }
}
