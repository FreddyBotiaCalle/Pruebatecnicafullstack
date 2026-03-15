import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequestsService } from '../service/requests.service';
import { CreateRequestDto } from '../dto/create-request.dto';

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  /**
   * POST /requests
   * Recibe texto, lo procesa con IA y lo guarda en MongoDB
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRequestDto, @Req() req: Request & { user?: { email?: string } }) {
    return this.requestsService.create(dto, req.user?.email || 'unknown@imix.local');
  }

  /**
   * GET /requests
   * Retorna todas las solicitudes almacenadas
   */
  @Get()
  findAll() {
    return this.requestsService.findAll();
  }

  /**
   * GET /requests/:id
   * Retorna una solicitud por su ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }
}
