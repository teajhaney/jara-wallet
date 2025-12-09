export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  appUrl:
    process.env.APP_URL || process.env.BASE_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,

  // Google OAuth 2.0 Configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID, // Your Google OAuth Client ID
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Your Google OAuth Client Secret
    redirectUri: process.env.GOOGLE_REDIRECT_URI, // Your callback URL (e.g., http://localhost:3000/auth/google/callback)
  },

  // Paystack Configuration
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY, // Your Paystack Secret Key (starts with sk_test_ or sk_live_)
    publicKey: process.env.PAYSTACK_PUBLIC_KEY, // Your Paystack Public Key (starts with pk_test_ or pk_live_)
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
    // Note: Webhook signature verification uses the SECRET KEY, not a separate webhook secret
    baseUrl: 'https://api.paystack.co', // Paystack API base URL
  },
});
