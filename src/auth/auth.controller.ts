import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';

import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';

import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

import type { Request, Response } from 'express';

import { RegisterRequestDto } from './dto/register-request.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import { Throttle } from '@nestjs/throttler'
import { verifyEmailRequestDto } from './dto/verifiy-email-request.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
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

  @Throttle({ default: { limit: 3, ttl: 60000 } })
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

  @Throttle({ default: { limit: 5, ttl: 60000 } })
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

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ResponseMessage('Logout successful')
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    const { id } = user
    await this.authService.logout(id)
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('send-verification-code')
  @ResponseMessage('Verification code sent')
  async sendVerificationCode(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    const { id } = user
    await this.authService.sendVerificationCode(id)
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('verify-email')
  @ResponseMessage('Email verified')
  async verifyEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body() verifyEmailRequestDto: verifyEmailRequestDto
  ): Promise<void> {
    const { id } = user
    const { code } = verifyEmailRequestDto

    await this.authService.verifyEmail(id, code)
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @ResponseMessage('If the email exists, a reset code will be sent')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto
    await this.authService.forgotPassword(email)
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('reset-password')
  @ResponseMessage('Password reset successful')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto)
  }

  /* @Post('compare')
  async compare(@Body() body: { id: string, refreshToken: string, newRefreshToken: string, hash: string, nowHash: string }) {
    return this.authService.compare(body)
  } */
}
