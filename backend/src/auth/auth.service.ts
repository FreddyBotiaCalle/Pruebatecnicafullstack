import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthUserPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  mockLogin(email = 'demo@imix.com'): { accessToken: string; expiresIn: string } {
    const payload: AuthUserPayload = {
      sub: 'user-demo-001',
      email,
      roles: ['user'],
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: '1h',
    };
  }
}
