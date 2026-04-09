import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { OpenAIProvider } from './providers/openai.provider';
import { AI_PROVIDER_TOKEN } from './ai.tokens';
import { IAIProvider } from './providers/ai-provider.interface';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ClientsModule } from '../clients/clients.module';
import { ServicesModule } from '../services/services.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [AppointmentsModule, ClientsModule, ServicesModule, StaffModule],
  providers: [
    OpenAIProvider,
    // To add a new provider: register it here and add a case in the factory below.
    // AiService never needs to import a concrete provider class.
    {
      provide: AI_PROVIDER_TOKEN,
      useFactory: (configService: ConfigService, openai: OpenAIProvider): IAIProvider => {
        const name = configService.get<string>('ai.provider', 'openai');
        switch (name) {
          case 'openai':
            return openai;
          // case 'google':
          //   return googleProvider;
          default:
            return openai;
        }
      },
      inject: [ConfigService, OpenAIProvider],
    },
    AiService,
  ],
  controllers: [AiController],
})
export class AiModule {}
