import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'vendas-client',
            brokers: [process.env.KAFKA_BROKER || 'kafka:29092'],
            retry: {
              initialRetryTime: 300,
              retries: 10
            }
          },
          consumer: {
            groupId: 'vendas-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}