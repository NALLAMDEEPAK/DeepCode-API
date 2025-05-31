import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProblemsModule } from './problems/problems.module';
import { ExecuteModule } from './execute/execute.module';

@Module({
  imports: [ProblemsModule, ExecuteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}