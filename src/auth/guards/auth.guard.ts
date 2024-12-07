import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header found');
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      // Tenta validar como Firebase primeiro
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
          });
        }

        request.user = user;
        return true;
      } catch (firebaseError) {
        // Se falhar, tenta JWT
        const payload = this.jwtService.verify(token);
        const user = await this.usersService.findById(payload.sub);
        if (!user) {
          throw new UnauthorizedException('User not found');
        }
        request.user = user;
        return true;
      }
    } catch (error) {
      console.error('Auth error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
