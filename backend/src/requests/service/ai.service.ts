import { Injectable } from '@nestjs/common';

/**
 * Servicio mock que simula una llamada a un proveedor de IA
 * (OpenAI, Claude, Gemini, etc.)
 *
 * En producción este servicio realizaría la llamada HTTP real al proveedor.
 */
@Injectable()
export class AIService {
  async process(text: string): Promise<string> {
    // Simulamos latencia de red / procesamiento de IA
    await this.delay(500);

    return `IA procesó el texto: "${text}" — Resultado simulado con confianza del 95%.`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
