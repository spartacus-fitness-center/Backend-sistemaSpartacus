import { Body, Controller, Post, Res } from '@nestjs/common';

import { AuthService } from './auth.service';

import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';

import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

import type { Response } from 'express';

import { RegisterRequestDto } from './dto/register-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ResponseMessage("Login successful")
  async login(@Body() loginRequestDto: LoginRequestDto, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDto> {
    const { user, accessToken, refreshToken } = await this.authService.login(loginRequestDto)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return { user, accessToken }
  }

  @Post('register')
  @ResponseMessage("User register successful")
  async register(@Body() registerRequestDto: RegisterRequestDto, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDto> {
    const { user, accessToken, refreshToken } = await this.authService.register(registerRequestDto)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return { user, accessToken }
  }
  @Post('compare')
  async compare(@Body() body: { id: string, refreshToken: string }) {
    return this.authService.compare(body)
  }
}
