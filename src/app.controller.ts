import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiAppTag, ApiGetHello } from './app.swagger';

@ApiAppTag()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiGetHello()
  getHello(): string {
    return this.appService.getHello();
  }
}
