import { Body, Controller, Post, Req, Res } from '@nestjs/common';

import { AuthService } from './auth.service';

import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';

import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

import type { Request, Response } from 'express';

import { RegisterRequestDto } from './dto/register-request.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';

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

  @Post('refresh')
  @ResponseMessage('Refresh token successful')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<RefreshResponseDto> {
    const refreshToken: string = req.cookies?.refreshToken

    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refresh(refreshToken)

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return { accessToken }
  }

  /* @Post('compare')
  async compare(@Body() body: { id: string, refreshToken: string, newRefreshToken: string, hash: string, nowHash: string }) {
    return this.authService.compare(body)
  } */
}
