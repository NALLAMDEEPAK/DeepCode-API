import { Module } from '@nestjs/common';
import { ProblemsModule } from './problems/problems.module';
import { ExecuteModule } from './execute/execute.module';

@Module({
  imports: [ProblemsModule, ExecuteModule],
})
export class AppModule {}