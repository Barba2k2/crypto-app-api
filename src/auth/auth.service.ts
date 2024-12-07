import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { AuthProviderData } from './interfaces/auth-provider.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
  ) {}

  async register(userData: AuthProviderData) {
    try {
      // Validação adicional para registro com email/senha
      if (!userData.googleId && !userData.password) {
        throw new UnauthorizedException(
          'Password is required for email registration',
        );
      }

      // Criar usuário no Firebase
      const firebaseUser = await this.firebaseService.createUser(userData);

      // Hash da senha apenas se for registro por email
      let hashedPassword: string | undefined;
      if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, 10);
      }

      // Criar usuário no nosso banco
      const user = await this.usersService.create({
        email: userData.email,
        name: userData.displayName || userData.email,
        password: hashedPassword,
        googleId: userData.googleId,
        firebaseId: firebaseUser.uid,
      });

      return {
        user: this.sanitizeUser(user),
        firebaseUser,
      };
    } catch (error) {
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { user: this.sanitizeUser(user), token };
  }

  private sanitizeUser(user: any) {
    const { password, ...result } = user;
    return result;
  }

  async validateFirebaseToken(token: string) {
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
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async validateJwtPayload(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async validateFirebaseUser(firebaseUser: any) {
    let user = await this.usersService.findByEmail(firebaseUser.email);

    if (!user) {
      user = await this.usersService.create({
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email,
        firebaseId: firebaseUser.uid,
      });
    }

    return user;
  }

  generateJwtToken(user: any) {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
