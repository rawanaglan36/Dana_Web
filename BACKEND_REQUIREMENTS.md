# Backend Requirements — Dana

---

## Super Admin

### What the super admin can control per doctor

| Action | Field | Endpoint | Status |
|--------|-------|----------|--------|
| Activate / Deactivate doctor | `isActive` | `PATCH /v1/doctor/:id` | done |
| Verify / Unverify doctor | `isVerified` | `PATCH /v1/doctor/:id` | done |
| Create password and activate account | — | `POST /v1/doctor/admin-signup/:id` | done — but password not sent to doctor email |
| View full doctor details | — | `GET /v1/doctor/:id` | done |
| Open doctor CV | `cv` URL | opens in new tab | broken — URL not accessible |
| Edit doctor name | `doctorName` | `PATCH /v1/doctor/:id` | not implemented in UI |
| Edit specialty | `specialty` | `PATCH /v1/doctor/:id` | not implemented in UI |
| Edit detection price | `detectionPrice` | `PATCH /v1/doctor/:id` | not implemented in UI |
| Edit city | `city` | `PATCH /v1/doctor/:id` | not implemented in UI |
| Edit address | `address` | `PATCH /v1/doctor/:id` | not implemented in UI |
| Edit years of experience | `expirtes` | `PATCH /v1/doctor/:id` | not implemented in UI |

---

## Missing or Broken

**1. Super Admin Login — not implemented**
```
POST /v1/admin/login
Body: { email: string, password: string }
Response: { access_token: string }
```
Currently the login is mocked and lets anyone in. The super admin token is hardcoded in the frontend source code which is a security risk.

**2. Send password to doctor email after Verify**

`POST /v1/doctor/admin-signup/:id` creates the password but does not send it to the doctor.

Required: after the super admin sets the password, the backend should send an email to the doctor containing:
- The password
- A login link

**3. CV URL is broken**

The `cv` field comes back in the response but the URL is not accessible or not a valid direct link.
Required: `cv` should be a direct URL that opens or downloads in the browser.

**4. Forgot password**
```
POST /v1/doctor/forgot-password
Body: { email: string }
Response: { message: "OTP sent to email" }
```
The button exists in the UI but is not connected to anything.

**5. Doctor login with email — DONE**

The login screen has a field labeled "Email or Mobile". The doctor can now log in with their email since that is what the super admin registers them with.

A doctor cannot log in unless the super admin has verified their account first. If the doctor tries to log in before being verified, the backend should block the request and return a 403 response indicating the account is not yet approved.

The flow works as follows:
1. Super admin verifies the doctor and sets a password
2. Backend sends the password to the doctor's registered email
3. Doctor logs in for the first time using email + password
4. OTP is sent to the doctor's email (not phone) on first login

Both endpoints now accept email:
```
POST /v1/doctor/pre-signIn
Body: { email: string, password: string }

POST /v1/doctor/verify-signIn  
Body: { email: string, otp: number }
```

---

## Priority

| # | Item | Priority |
|---|------|----------|
| 1 | Real super admin login + remove hardcoded token | Critical |
| 2 | Send password to doctor email on Verify | Critical |
| 3 | Forgot password | High |
| 4 | Fix CV URL | High |
