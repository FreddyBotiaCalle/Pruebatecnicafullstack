import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRequestDto } from '../dto/create-request.dto';
import { RequestResponseDto } from '../dto/request-response.dto';
import { RequestEntity, RequestDocument } from '../schemas/request.schema';
import { AIService } from './ai.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(RequestEntity.name)
    private readonly requestModel: Model<RequestDocument>,
    private readonly aiService: AIService,
  ) {}

  async create(dto: CreateRequestDto, userEmail: string): Promise<RequestResponseDto> {
    try {
      // 1. Llamar al servicio de IA (mock)
      const aiResult = await this.aiService.process(dto.text);

      // 2. Guardar en MongoDB con resultado procesado
      const newRequest = new this.requestModel({
        text: dto.text,
        requestedBy: userEmail,
        result: aiResult,
        status: 'completed',
      });

      const created = await newRequest.save();
      return this.toResponseDto(created);
    } catch (error) {
      throw new InternalServerErrorException('Error al procesar la solicitud');
    }
  }

  async findAll(): Promise<RequestResponseDto[]> {
    const requests = await this.requestModel.find().sort({ createdAt: -1 }).exec();
    return requests.map((request) => this.toResponseDto(request));
  }

  async findOne(id: string): Promise<RequestResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El id enviado no es valido');
    }

    const request = await this.requestModel.findById(id).exec();
    if (!request) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }
    return this.toResponseDto(request);
  }

  private toResponseDto(request: RequestDocument): RequestResponseDto {
    return {
      id: request._id.toString(),
      text: request.text,
      result: request.result,
      status: request.status,
      createdAt: request.createdAt,
    };
  }
}
