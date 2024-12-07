import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { FirebaseService } from '../../firebase/firebase.service';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase') {
  constructor(
    private firebaseService: FirebaseService,
    private usersService: UsersService,
  ) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const token = req.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const decodedToken = await this.firebaseService.verifyToken(token);
      let user = await this.usersService.findByEmail(decodedToken.email);

      if (!user) {
        const firebaseUser = await this.firebaseService.getUser(
          decodedToken.uid,
        );
        user = await this.usersService.create({
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email,
          firebaseId: firebaseUser.uid,
          googleId:
            decodedToken.firebase?.sign_in_provider === 'google.com'
              ? decodedToken.uid
              : null,
        });
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
