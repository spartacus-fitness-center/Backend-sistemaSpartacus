export class DefaultResponse<T> {
    success: boolean
    message: string
    data: T

    constructor(data: T, message = 'Operación exitosa', success = true) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
}