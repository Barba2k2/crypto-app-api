import * as admin from 'firebase-admin';
import { join } from 'path';

export function initalizeFirebase() {
  const serviceAccount = require(
    join(process.cwd(), 'firebase-service-account.json'),
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin;
}