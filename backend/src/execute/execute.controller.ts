import { Controller, Post, Body } from '@nestjs/common';
import { ExecuteService } from './execute.service';

@Controller('execute')
export class ExecuteController {
  constructor(private readonly executeService: ExecuteService) {}

  @Post()
  async execute(@Body() body: { code: string; language: string; input: string }) {
    return this.executeService.execute(body);
  }
}