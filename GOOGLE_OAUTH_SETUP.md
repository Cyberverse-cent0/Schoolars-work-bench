# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for ScholarForge, allowing users to sign up and sign in with their Google accounts.

## Prerequisites

- A Google Cloud Project
- OAuth 2.0 credentials (Client ID)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown and select "NEW PROJECT"
3. Enter a project name (e.g., "ScholarForge") and click "CREATE"
4. Wait for the project to be created

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "ENABLE"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If you haven't created a consent screen yet, click "Create OAuth consent screen"

### Configure OAuth Consent Screen:

1. Choose "External" for User Type
2. Click "CREATE"
3. Fill in the required fields:
   - **App name**: ScholarForge
   - **User support email**: your-email@example.com
   - **Developer contact**: your-email@example.com
4. Click "SAVE AND CONTINUE"
5. Skip the scopes and click "SAVE AND CONTINUE"
6. Add test users if needed, then click "SAVE AND CONTINUE"
7. Review and click "BACK TO DASHBOARD"

### Create OAuth Client ID:

1. Go back to "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Under "Authorized JavaScript origins", add:
   - `http://localhost:8081` (local development)
   - `http://localhost:5173` (Vite dev server)
   - Your production URL
5. Under "Authorized redirect URIs", add:
   - `http://localhost:8081` (local development)
   - `http://localhost:5173` (Vite dev server)
   - Your production URL
6. Click "CREATE"
7. Copy the **Client ID** (you'll need this)

## Step 4: Configure Environment Variables

### Backend (.env file in root or set via docker-compose):

```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### Frontend (.env file in artifacts/scholar-forge/):

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

Example `.env` file:
```
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
```

## Step 5: Database Migration

The database schema has been updated to support OAuth. Run the migration:

```bash
pnpm --filter @workspace/db run push
```

This will add the following columns to the users table:
- `google_id`: Stores the unique Google user ID
- `oauth_provider`: Tracks which OAuth provider was used (e.g., 'google')

## Step 6: Test the Setup

1. Start the application:
   ```bash
   ./start.sh
   ```

2. Open http://localhost:8081 in your browser

3. On the Sign Up page, click the Google Sign-In button

4. Sign in with your Google account

5. You should be redirected to the dashboard

## Troubleshooting

### "Google Sign-In button not showing"
- Check browser console for errors
- Ensure `VITE_GOOGLE_CLIENT_ID` is set correctly
- Verify the Google Client ID matches the one in the backend

### "Invalid Google token" error
- Check that `GOOGLE_CLIENT_ID` is set in the backend environment
- Ensure the token hasn't expired (they're valid for ~1 hour)
- Verify the Client ID matches between frontend and backend

### Sign-up fails with "Email already in use"
- The email is already registered with a different method
- Try signing in with your password instead, or use a different email

### Database errors
- Run `pnpm --filter @workspace/db run push` to apply schema changes
- Ensure PostgreSQL is running: `docker-compose ps`

## Features Implemented

✅ **Google Sign-Up**: Create new accounts with Google
✅ **Google Sign-In**: Log in with existing Google account
✅ **Token Verification**: Secure backend validation of Google tokens
✅ **User Creation**: Automatically creates user with Google profile data
✅ **Email Linking**: Prevents duplicate accounts with same email
✅ **Debug Logging**: Detailed console logs for troubleshooting

## Security Notes

- Client ID is exposed in frontend (this is normal for OAuth public clients)
- Backend validates all Google tokens server-side
- Passwords are hashed with bcrypt
- JWT tokens expire after 7 days
- CORS is configured to prevent unauthorized requests

## Next Steps

- Add support for more OAuth providers (GitHub, Microsoft, etc.)
- Implement email verification
- Add account linking (link multiple OAuth providers to one account)
- Add user profile management
