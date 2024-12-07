import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { join } from 'path';
import { AuthProviderData } from 'src/auth/interfaces/auth-provider.interface';

@Injectable()
export class FirebaseService {
  private firebaseAdmin: admin.app.App;

  constructor() {
    try {
      const serviceAccount = require(
        join(process.cwd(), 'firebase-service-account.json'),
      );

      this.firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  }

  // Auth
  async createUser(userData: AuthProviderData) {
    try {
      // Verifica se é um registro com email/senha ou provedor externo
      const createUserData: admin.auth.CreateRequest = {
        email: userData.email,
        displayName: userData.displayName,
      };

      // Adiciona senha apenas se fornecida (registro por email/senha)
      if (userData.password) {
        createUserData.password = userData.password;
      }

      // Se tem googleId, é um registro via Google
      if (userData.googleId) {
        createUserData.uid = userData.googleId;
      }

      const userRecord = await this.firebaseAdmin
        .auth()
        .createUser(createUserData);
      return userRecord;
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        throw new UnauthorizedException('Email already exists');
      }
      throw error;
    }
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.firebaseAdmin.auth().verifyIdToken(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.firebaseAdmin.auth().getUser(uid);
    } catch (error) {
      throw new UnauthorizedException('User not found');
    }
  }

  // Notifications
  async sendNotification(
    token: string,
    notification: admin.messaging.Notification,
  ) {
    try {
      return await this.firebaseAdmin.messaging().send({
        token,
        notification,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Topic Notifications
  async sendToTopic(topic: string, notification: admin.messaging.Notification) {
    try {
      return await this.firebaseAdmin.messaging().send({
        topic,
        notification,
      });
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw error;
    }
  }

  // Data
  async getUserData(uid: string) {
    try {
      const user = await this.getUser(uid);
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(
    uid: string,
    data: {
      displayName?: string;
      photoURL?: string;
      email?: string;
    },
  ) {
    try {
      return await this.firebaseAdmin.auth().updateUser(uid, data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(uid: string) {
    try {
      await this.firebaseAdmin.auth().deleteUser(uid);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
