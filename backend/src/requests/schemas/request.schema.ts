import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RequestDocument = RequestEntity & Document;

@Schema()
export class RequestEntity {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  requestedBy: string;

  @Prop()
  result: string;

  @Prop({ default: 'pending', enum: ['pending', 'processing', 'completed', 'error'] })
  status: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

export const RequestSchema = SchemaFactory.createForClass(RequestEntity);
