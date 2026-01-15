import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Partitioners } from 'kafkajs';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `[${timestamp}] ${level}: [${context || 'Vendas'}] ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error'
        }),
      ],
    }),
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'vendas',
        brokers: [process.env.KAFKA_BROKER || 'kafka:29092'],
        retry: {
          initialRetryTime: 300,
          retries: 10
        }
      },
      producer: {
        createPartitioner: Partitioners.LegacyPartitioner,
      },
      consumer: {
        groupId: 'vendas-consumer',
      },
    },
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.startAllMicroservices();
  await app.listen(3000);

  const logger = new (require('@nestjs/common').Logger)('Bootstrap');
  logger.log('🚀 Microsserviço de Vendas rodando em http://localhost:3000');
}
bootstrap();