import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  // Check if all required environment variables are present
  const projectId = process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID;
  const privateKey = process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.error('Missing Firebase Admin SDK environment variables:');
    console.error('- FIREBASE_SERVICE_ACCOUNT_PROJECT_ID:', projectId ? '✓' : '✗ Missing');
    console.error('- FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY:', privateKey ? '✓' : '✗ Missing');
    console.error('- FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL:', clientEmail ? '✓' : '✗ Missing');
    throw new Error('Firebase Admin SDK configuration is incomplete. Please check your environment variables.');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail,
      }),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

/**
 * Verify Firebase Auth token and return user info
 * @param token - Firebase ID token
 * @returns User info with uid
 */
export async function verifyAuthToken(token: string) {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '');
    
    const decodedToken = await admin.auth().verifyIdToken(cleanToken);

    // Prefer values from token, but backfill from Admin user record if missing
    let displayName = decodedToken.name || '';
    let photoURL = (decodedToken as any).picture || '';

    if (!displayName || !photoURL) {
      try {
        const userRecord = await admin.auth().getUser(decodedToken.uid);
        displayName = displayName || userRecord.displayName || '';
        photoURL = photoURL || userRecord.photoURL || '';
      } catch {
        // ignore fetch errors; fall back to whatever we have
      }
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      // Provide commonly used aliases expected by routes
      displayName,
      photoURL
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Middleware to verify authentication for API routes
 * @param req - Next.js API request
 * @returns User info
 */
export async function requireAuth(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    throw new Error('Authorization header required');
  }

  return await verifyAuthToken(authHeader);
}
