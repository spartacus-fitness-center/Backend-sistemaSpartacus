import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ResetPassword, VerifyCode } from 'src/common/interfaces/mail.interface';

@Injectable()
export class MailService {

    constructor(private mailer: MailerService) { }

    async sendVerificationCode(data: VerifyCode) {
        const { email, name, code, minutes } = data

        await this.mailer.sendMail({
            to: email,
            subject: 'Código de verificación',
            template: 'verify-code',
            context: {
                name,
                code,
                minutes
            }
        });
    }

    async sendResetPassword(data: ResetPassword) {
        const { email, name, code, minutes } = data

        await this.mailer.sendMail({
            to: email,
            subject: 'Restablecer contraseña',
            template: 'reset-password',
            context: {
                name,
                code,
                minutes
            }
        });
    }
}