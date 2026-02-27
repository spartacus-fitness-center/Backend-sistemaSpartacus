import { Body, Controller, Get, Res } from '@nestjs/common';

import { AuthService } from './auth.service';

import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';

import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('login')
  @ResponseMessage("Login successful")
  async login(@Body() loginRequestDto: LoginRequestDto, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDto> {
    const { user, accessToken, refreshToken } = await this.authService.login(loginRequestDto)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
      // maxAge: 30 * 1000
    })

    return { user, accessToken }
  }

  @Get('register')
  register() {
    return "register"
  }
}
