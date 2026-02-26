import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublicResponse';
export const NoStandardResponse = () => SetMetadata(IS_PUBLIC_KEY, true);
