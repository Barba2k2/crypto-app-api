
import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Moralis from 'moralis';
import moralisConfig from './moralis.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(moralisConfig)],
  providers: [
    {
      provide: 'MORALIS',
      useFactory: async (configService: ConfigService) => {
        const apiKey = configService.get<string>('moralis.apiKey');
        if (!apiKey) {
          throw new Error('MORALIS_API_KEY not configured');
        }

        await Moralis.start({
          apiKey,
        });
        return Moralis;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['MORALIS'],
})
export class MoralisModule {}
