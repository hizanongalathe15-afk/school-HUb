# Deployment Environment Variables Guide

## For Render (Backend/Server)

Set these environment variables in your Render dashboard:

```
PORT=4000
CLIENT_URL=https://your-vercel-url.vercel.app
DATABASE_URL=postgresql://user:password@host:5432/school_hub
JWT_SECRET=your-long-random-secret-key-here
JWT_REFRESH_SECRET=your-long-random-refresh-secret-here
REDIS_ENABLED=false
UPLOAD_MAX_FILE_SIZE_MB=10
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
CLOUDINARY_FOLDER=school-hub
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your-mpesa-key
MPESA_CONSUMER_SECRET=your-mpesa-secret
MPESA_SHORTCODE=your-shortcode
MPESA_PASSKEY=your-passkey
MPESA_CALLBACK_URL=https://your-render-url/api/fees/mpesa/callback
SMS_PROVIDER=your-provider
SMS_API_KEY=your-sms-key
SMS_USERNAME=your-sms-username
SMS_SENDER_ID=SchoolHub
WHATSAPP_ENABLED=false
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-id
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_VERIFY_TOKEN=school-hub-verify
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=School Hub <noreply@schoolhub.local>
```

### Required Services:
1. **PostgreSQL Database** - Use Render's Postgres or Supabase
2. **JWT Secrets** - Generate with: `openssl rand -base64 32`

---

## For Vercel (Frontend/Client)

Set these environment variables in Vercel dashboard:

```
VITE_API_URL=https://your-render-url.onrender.com
```

Replace `https://your-render-url.onrender.com` with your actual Render server URL.

---

## Step-by-Step Setup

### 1. Render Deployment
1. Go to https://dashboard.render.com
2. Create **New Web Service**
3. Connect GitHub (select `school-HUb` repo)
4. Configure:
   - Name: `school-hub-server`
   - Root Directory: `server`
   - Build Command: `npm run build`
   - Start Command: `npm start`
5. Add all environment variables above
6. Create PostgreSQL database in Render
7. Deploy!

### 2. Vercel Deployment
1. Go to https://vercel.com
2. Import Project
3. Select `school-HUb` repository
4. Configure:
   - Framework: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add `VITE_API_URL` environment variable
6. Deploy!

---

## Getting Credentials

### PostgreSQL (Render)
- Create free PostgreSQL in Render dashboard
- Copy connection string to `DATABASE_URL`

### JWT Secrets
```bash
openssl rand -base64 32
```

### M-Pesa (Optional)
- Register at https://developer.safaricom.co.ke
- Get credentials from Sandbox/Production

### Cloudinary (for media uploads)
- Sign up at https://cloudinary.com
- Get API credentials from dashboard

### Email (SMTP)
- Use Gmail: Enable 2FA, create App Password
- Or use SendGrid/Mailgun

---

## Testing
After deployment, test:
1. Frontend loads at Vercel URL
2. Login works (connects to Render API)
3. Check browser console for API errors
4. Check Render logs for server errors

