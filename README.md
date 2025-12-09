# Jara Wallet API

A comprehensive digital wallet system built with NestJS, featuring payment integration via Paystack, secure API key management, and Google OAuth authentication.

## 🚀 Features

### Core Functionality

- **Digital Wallet Management**: Create and manage user wallets with unique 13-digit wallet numbers
- **Deposit System**: Initialize deposits via Paystack payment gateway
- **Transfer System**: Transfer funds between wallets using wallet numbers
- **Transaction History**: Track all deposits and transfers with status updates
- **Balance Management**: Real-time balance tracking in Nigerian Naira (₦)

### Authentication & Security

- **Google OAuth 2.0**: Secure authentication via Google Sign-In
- **JWT Authentication**: Token-based authentication for API access
- **API Key Management**: Create and manage API keys with granular permissions
- **Permission-Based Access**: Fine-grained control over API key permissions (read, deposit, transfer)

### Payment Integration

- **Paystack Integration**: Seamless payment processing for deposits
- **Webhook Support**: Real-time transaction status updates via Paystack webhooks
- **Transaction Status Tracking**: Monitor deposit status (pending, success, failed)

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**:
  - Google OAuth 2.0 (Passport.js)
  - JWT (JSON Web Tokens)
- **Payment Gateway**: [Paystack](https://paystack.com/)
- **API Documentation**: Swagger/OpenAPI
- **Language**: TypeScript
- **Validation**: class-validator & class-transformer

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (local or cloud-hosted)
- **Google OAuth Credentials** (for authentication)
- **Paystack Account** (for payment processing)

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd jara-wallet
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/jara_wallet?schema=public"

   # Application
   PORT=3000
   APP_URL="http://localhost:3000"

   # JWT
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

   # Google OAuth 2.0
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"

   # Paystack
   PAYSTACK_SECRET_KEY="sk_test_your_paystack_secret_key"
   PAYSTACK_PUBLIC_KEY="pk_test_your_paystack_public_key"
   PAYSTACK_WEBHOOK_SECRET="your_webhook_secret"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

Once the server is running, access the interactive Swagger documentation at:

**Local**: `http://localhost:3000/api`  
**Production**: `https://jara-wallet.vercel.app/api`

The Swagger UI provides:

- Complete API endpoint documentation
- Interactive API testing
- Request/response schemas
- Authentication testing (JWT & API Keys)

## 🧪 Testing the API

### 1. Authentication Flow

#### Step 1: Authenticate with Google OAuth

Open your browser and navigate to:

```
GET http://localhost:3000/auth/google
```

This will redirect you to Google's OAuth consent screen. After authentication, you'll be redirected to the callback URL with a JWT token.

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "message": "Authentication successful"
}
```

#### Step 2: Use the JWT Token

Copy the `access_token` and use it in subsequent requests:

```bash
# Set your token as a variable
export TOKEN="your-jwt-token-here"
```

### 2. Wallet Endpoints

#### Get Wallet Information

```bash
curl -X GET http://localhost:3000/wallet \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**

```json
{
  "id": "wallet-id",
  "userId": "user-id",
  "walletNumber": "1234567890123",
  "balance": "50000",
  "balanceInNaira": 500,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get Balance

```bash
curl -X GET http://localhost:3000/wallet/balance \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**

```json
{
  "balance": "50000",
  "balanceInNaira": 500
}
```

### 3. Deposit Endpoints

#### Initialize Deposit

```bash
curl -X POST http://localhost:3000/wallet/deposit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000
  }'
```

**Response:**

```json
{
  "authorization_url": "https://checkout.paystack.com/...",
  "reference": "T1234567890",
  "message": "Deposit initialized successfully. Redirect user to authorization_url to complete payment."
}
```

**Note**: Amount is in Nigerian Naira (₦). The system stores amounts in kobo (1 Naira = 100 kobo).

#### Check Deposit Status

```bash
curl -X GET http://localhost:3000/wallet/deposit/T1234567890/status \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**

```json
{
  "reference": "T1234567890",
  "status": "SUCCESS",
  "amount": "100000",
  "amountInNaira": 1000,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. Transfer Endpoints

#### Transfer Funds

```bash
curl -X POST http://localhost:3000/wallet/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_number": "9876543210987",
    "amount": 500
  }'
```

**Response:**

```json
{
  "message": "Transfer successful",
  "transactionId": "tx-id",
  "amount": "50000",
  "amountInNaira": 500,
  "recipientWalletNumber": "9876543210987",
  "newBalance": "450000",
  "newBalanceInNaira": 4500
}
```

### 5. Transaction History

#### Get Transaction History

```bash
curl -X GET http://localhost:3000/wallet/transactions \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**

```json
[
  {
    "id": "tx-id-1",
    "type": "DEPOSIT",
    "amount": "100000",
    "amountInNaira": 1000,
    "status": "SUCCESS",
    "recipientWalletNumber": null,
    "metadata": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "tx-id-2",
    "type": "TRANSFER",
    "amount": "50000",
    "amountInNaira": 500,
    "status": "SUCCESS",
    "recipientWalletNumber": "9876543210987",
    "metadata": null,
    "createdAt": "2024-01-01T01:00:00.000Z",
    "updatedAt": "2024-01-01T01:00:00.000Z"
  }
]
```

### 6. API Key Management

#### Create API Key

```bash
curl -X POST http://localhost:3000/keys/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My API Key",
    "permissions": ["read", "deposit", "transfer"],
    "expiresInDays": 30
  }'
```

**Response:**

```json
{
  "apiKey": "sk_live_abc123def456...",
  "keyPrefix": "sk_live_abc",
  "name": "My API Key",
  "permissions": ["read", "deposit", "transfer"],
  "expiresAt": "2024-02-01T00:00:00.000Z",
  "message": "API key created successfully. Store this key securely - it will not be shown again."
}
```

**⚠️ Important**: Save the API key immediately - it's only shown once!

#### Using API Keys

Instead of JWT tokens, you can use API keys:

```bash
export API_KEY="sk_live_abc123def456..."

curl -X GET http://localhost:3000/wallet/balance \
  -H "X-API-Key: $API_KEY"
```

#### Rollover API Key

```bash
curl -X POST http://localhost:3000/keys/rollover \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldKeyPrefix": "sk_live_abc",
    "name": "My Updated API Key",
    "expiresInDays": 60
  }'
```

### 7. Health Check

```bash
curl -X GET http://localhost:3000/
```

**Response:**

```json
{
  "status": "healthy",
  "service": "Jara Wallet API",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 1234.56,
  "environment": "development",
  "message": "API is running successfully"
}
```

## 🔐 Authentication Methods

The API supports two authentication methods:

### 1. JWT Authentication (Bearer Token)

- **Use Case**: User-facing applications, web apps
- **Header**: `Authorization: Bearer <token>`
- **Obtained**: Via Google OAuth flow (`/auth/google/callback`)

### 2. API Key Authentication

- **Use Case**: Server-to-server communication, integrations
- **Header**: `X-API-Key: <api-key>`
- **Obtained**: Via `/keys/create` endpoint (requires JWT auth)
- **Permissions**: Granular control (read, deposit, transfer)

## 📊 Database Schema

### Models

- **User**: Stores user information (email, name, Google ID)
- **Wallet**: User wallet with balance and unique wallet number
- **Transaction**: All deposits and transfers with status tracking
- **ApiKey**: API keys with permissions and expiration

### Key Relationships

- One User → One Wallet
- One User → Many Transactions
- One User → Many API Keys
- One Wallet → Many Transactions (as sender or recipient)

## 🚢 Deployment

### Vercel Deployment

1. **Set up environment variables** in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (use your Vercel URL)
   - `PAYSTACK_SECRET_KEY`
   - `PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_WEBHOOK_SECRET`
   - `APP_URL` (your production URL: `https://jara-wallet.vercel.app`)

2. **Configure Paystack Webhook**:
   - Go to Paystack Dashboard → Settings → Webhooks
   - Add webhook URL: `https://your-app.vercel.app/wallet/paystack/webhook`
   - Copy the webhook secret to `PAYSTACK_WEBHOOK_SECRET`

3. **Deploy**:

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

### Environment-Specific Configuration

- **Development**: Uses `http://localhost:3000`
- **Production**: Uses `APP_URL` environment variable
- **Vercel Preview**: Automatically uses `VERCEL_URL` if `APP_URL` is not set

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 API Endpoints Summary

| Method | Endpoint                            | Auth        | Description              |
| ------ | ----------------------------------- | ----------- | ------------------------ |
| GET    | `/`                                 | None        | Health check             |
| GET    | `/auth/google`                      | None        | Initiate Google OAuth    |
| GET    | `/auth/google/callback`             | None        | Google OAuth callback    |
| GET    | `/wallet`                           | JWT/API Key | Get wallet information   |
| GET    | `/wallet/balance`                   | JWT/API Key | Get wallet balance       |
| POST   | `/wallet/deposit`                   | JWT/API Key | Initialize deposit       |
| GET    | `/wallet/deposit/:reference/status` | JWT/API Key | Check deposit status     |
| POST   | `/wallet/transfer`                  | JWT/API Key | Transfer funds           |
| GET    | `/wallet/transactions`              | JWT/API Key | Get transaction history  |
| POST   | `/wallet/paystack/webhook`          | Paystack    | Paystack webhook handler |
| POST   | `/keys/create`                      | JWT         | Create API key           |
| POST   | `/keys/rollover`                    | JWT         | Rollover API key         |

## 🔒 Security Features

- **Password Hashing**: API keys are hashed using bcrypt
- **JWT Tokens**: Secure token-based authentication
- **Webhook Verification**: Paystack webhook signature verification
- **Permission System**: Granular API key permissions
- **CORS Protection**: Configurable CORS settings
- **Input Validation**: Request validation using class-validator

## 📖 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Paystack API Documentation](https://paystack.com/docs/api/)
- [Swagger/OpenAPI Documentation](https://swagger.io/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License.

## 👤 Author

Built as part of the HNG Backend Development Program.

---

**Note**: This is a development project. Ensure proper security measures are in place before production deployment.
