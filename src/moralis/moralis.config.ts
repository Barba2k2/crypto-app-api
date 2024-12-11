import { registerAs } from '@nestjs/config';

export default registerAs('moralis', () => ({
  apiKey: process.env.MORALIS_API_KEY,
}));
