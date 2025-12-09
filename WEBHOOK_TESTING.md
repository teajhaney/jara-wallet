# Paystack Webhook Testing Guide

## Important: Webhook Signature Verification

According to [Paystack documentation](https://paystack.com/docs/payments/webhooks/), webhook signatures are verified using your **SECRET KEY** (not a separate webhook secret). The signature is computed using HMAC SHA512 of the JSON stringified request body.

## Step 1: Set Up Your Paystack Webhook URL

1. **Log into Paystack Dashboard**: https://dashboard.paystack.com
2. **Go to Settings** → **API Keys & Webhooks**
3. **Click on "Webhooks"** tab
4. **Add a new webhook**:
   - URL: `https://your-ngrok-url.ngrok.io/wallet/paystack/webhook`
   - Events: Select `charge.success` (or all events for testing)
5. **Save the webhook** - Paystack will start sending events to this URL

**Note**: Paystack uses your SECRET KEY for signature verification, so make sure `PAYSTACK_SECRET_KEY` is set in your `.env` file.

## Step 2: Set Up ngrok

1. **Install ngrok** (if not already installed):

   ```bash
   brew install ngrok  # macOS
   # or download from https://ngrok.com/download
   ```

2. **Start your NestJS server**:

   ```bash
   npm run start:dev
   ```

3. **In a new terminal, start ngrok**:

   ```bash
   ngrok http 3000
   # Replace 3000 with your PORT if different
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Update Paystack webhook URL**:
   - Go back to Paystack Dashboard → Settings → Webhooks
   - Update the webhook URL to: `https://abc123.ngrok.io/wallet/paystack/webhook`
   - Save

## Step 3: Test the Webhook

### Option A: Test with Real Payment (Recommended)

1. **Initialize a deposit**:

   ```bash
   curl -X POST http://localhost:3000/wallet/deposit \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"amount": 10000}'
   ```

2. **Copy the `authorization_url`** from the response

3. **Open the URL in your browser** and complete the test payment

4. **Check your server logs** - you should see:

   ```
   Received Paystack webhook: { event: 'charge.success', reference: '...', status: 'success' }
   ```

5. **Verify the transaction was updated**:
   ```bash
   curl -X GET http://localhost:3000/wallet/deposit/JARA_xxx/status \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Option B: Test with Paystack Webhook Simulator

1. **Go to Paystack Dashboard** → **Settings** → **Webhooks**
2. **Click "Send Test Event"** next to your webhook
3. **Select event type**: `charge.success`
4. **Fill in the test data**:
   ```json
   {
     "event": "charge.success",
     "data": {
       "reference": "JARA_1234567890_TEST123",
       "status": "success",
       "amount": 10000
     }
   }
   ```
5. **Click "Send Test Event"**
6. **Check your server logs** for the webhook receipt

## Step 4: Troubleshooting

### Issue: "Missing Paystack signature"

- **Solution**: Make sure you're sending the `x-paystack-signature` header
- Paystack automatically includes this header, but if testing manually, you need to generate it

### Issue: "Invalid Paystack signature"

- **Solution**:
  1. Verify `PAYSTACK_SECRET_KEY` in your `.env` matches your Paystack dashboard (test mode uses `sk_test_xxx`)
  2. Make sure you're using the **raw JSON stringified body** for signature verification
  3. Check that ngrok is forwarding the request correctly
  4. Ensure the raw body is exactly as Paystack sent it (no modifications)

### Issue: Webhook not being received

- **Check ngrok logs**: Look at the ngrok web interface (http://127.0.0.1:4040)
- **Check server logs**: Look for incoming POST requests to `/wallet/paystack/webhook`
- **Verify webhook URL**: Make sure Paystack webhook URL matches your ngrok URL exactly

### Issue: Transaction not updating

- **Check logs**: Look for "Received Paystack webhook" log message
- **Verify reference**: Make sure the reference in the webhook matches a transaction in your database
- **Check transaction status**: Query the database to see if transaction exists and its current status

## Step 5: Manual Webhook Testing (Advanced)

If you want to test manually without Paystack:

```bash
# Generate signature manually (Node.js)
# Use your SECRET KEY (sk_test_xxx), not a separate webhook secret
node -e "
const crypto = require('crypto');
const secretKey = 'sk_test_xxxxx'; // Your Paystack SECRET KEY
const payload = JSON.stringify({
  event: 'charge.success',
  data: {
    reference: 'JARA_1234567890_TEST123',
    status: 'success',
    amount: 10000
  }
});
const signature = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');
console.log('Signature:', signature);
console.log('Payload:', payload);
"

# Then send the webhook:
curl -X POST http://localhost:3000/wallet/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: GENERATED_SIGNATURE" \
  -d 'PAYLOAD_JSON'
```

## Important Notes

1. **Test Mode**: In test mode, Paystack uses test keys (sk_test_xxx)
2. **Webhook Secret**: Different for test and live mode - make sure you're using the correct one
3. **ngrok URL Changes**: Free ngrok URLs change each time you restart - update Paystack webhook URL accordingly
4. **Signature Verification**: The webhook handler will skip signature verification if `PAYSTACK_WEBHOOK_SECRET` is not set (for local testing only)

## Environment Variables Needed

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxx  # Used for API calls AND webhook signature verification
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx  # Used for frontend integration
```

**Important**: Paystack uses your SECRET KEY to sign webhooks, so make sure `PAYSTACK_SECRET_KEY` is correctly set. No separate webhook secret is needed.
