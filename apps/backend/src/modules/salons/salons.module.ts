import { Module } from '@nestjs/common';
import { SalonsService } from './salons.service';
import { SalonsController } from './salons.controller';

@Module({
  providers: [SalonsService],
  controllers: [SalonsController],
  exports: [SalonsService],
})
export class SalonsModule {}
