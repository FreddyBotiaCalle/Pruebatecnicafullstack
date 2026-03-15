import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('mock-login')
  mockLogin(@Body('email') email?: string) {
    return this.authService.mockLogin(email);
  }
}
