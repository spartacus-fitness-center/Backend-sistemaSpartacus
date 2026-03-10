export interface VerifyCode {
    email: string,
    name: string,
    code: string,
    minutes: number
}

export interface ResetPassword {
    email: string,
    name: string,
    code: string,
    minutes: number
}