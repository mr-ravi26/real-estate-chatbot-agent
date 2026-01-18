# Security Features

## 🔒 Password Protection

The application is now secured with password authentication. All pages (except the login page) require authentication to access.

### Setup

1. **Set Your Password** in `.env`:
   ```env
   APP_PASSWORD=your_secure_password_here
   ```

2. **Disable Authentication** (optional):
   - Leave `APP_PASSWORD` empty or remove it from `.env` to disable authentication
   ```env
   APP_PASSWORD=
   ```

3. **Access the App**:
   - Visit http://localhost:3000
   - You'll be redirected to `/login`
   - Enter your password
   - Session lasts 24 hours

### Features

✅ **Password Protection**
- Simple password-based authentication
- Secure cookie-based sessions (24-hour expiry)
- Automatic redirect to login for unauthenticated users
- Already authenticated users auto-redirect from login page

✅ **API Rate Limiting**
- 30 requests per minute per IP address
- Prevents API abuse
- Returns 429 status when limit exceeded
- Automatic reset after 1 minute

✅ **Security Best Practices**
- HttpOnly cookies (prevents XSS attacks)
- Secure cookies in production
- SameSite strict policy
- Environment variable validation
- Protected API endpoints

### How It Works

1. **Middleware** ([middleware.ts](middleware.ts))
   - Intercepts all requests
   - Checks authentication status
   - Enforces rate limits on API routes
   - Redirects unauthenticated users to login

2. **Login Page** ([app/login/page.tsx](app/login/page.tsx))
   - Clean UI matching the app design
   - Password verification via API
   - Error handling and feedback

3. **Auth API** ([app/api/auth/login/route.ts](app/api/auth/login/route.ts))
   - Validates password against `APP_PASSWORD`
   - Sets secure authentication cookie
   - Returns success/error responses

### Production Deployment

**Important:**  Change the default password before deploying!

```env
# ❌ DON'T use this
APP_PASSWORD=your_secure_password_here

# ✅ DO use a strong password
APP_PASSWORD=MyStr0ng!P@ssw0rd#2026
```

### Rate Limiting

The API is protected with rate limiting:
- **Limit**: 30 requests per minute per IP
- **Window**: 60 seconds
- **Scope**: All `/api/*` routes

For production, consider using:
- Redis for distributed rate limiting
- More sophisticated rate limiting (e.g., per-user, per-endpoint)
- DDoS protection services

### Disable Security

To disable all security features:

1. Remove or comment out `APP_PASSWORD` in `.env`:
   ```env
   # APP_PASSWORD=
   ```

2. The middleware will allow all requests through
3. Rate limiting will still be active

---

**Note**: This is a basic authentication system suitable for demo/internal use. For production applications, consider:
- OAuth2 / NextAuth.js for robust authentication
- Role-based access control (RBAC)
- Two-factor authentication (2FA)
- Redis/database-backed rate limiting
- HTTPS enforcement
- Content Security Policy (CSP)
