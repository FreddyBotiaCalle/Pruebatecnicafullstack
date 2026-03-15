import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestsController } from './controller/requests.controller';
import { RequestsService } from './service/requests.service';
import { AIService } from './service/ai.service';
import { RequestEntity, RequestSchema } from './schemas/request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequestEntity.name, schema: RequestSchema },
    ]),
  ],
  controllers: [RequestsController],
  providers: [RequestsService, AIService],
})
export class RequestsModule {}
