declare module 'passport-custom' {
  import { Strategy } from 'passport';

  export class Strategy extends PassportStrategy {
    constructor(
      verify: (
        req: any,
        done: (error: any, user?: any, options?: any) => void,
      ) => void,
    );
  }
}
