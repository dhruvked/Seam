# HealthOS - Prototype

ABDM-compatible health records web app prototype.

Built with Next.js 15, deployed on Vercel.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Flow

1. **Landing page** → click "Login with ABHA"
2. **Login** → enter ABHA number / address / mobile
3. **OTP** → enter any 6 digits (prototype mode)
4. **Dashboard** → view health records, prescriptions, lab reports, QR

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Vanilla CSS
- Vercel deployment

## ABDM Integration (coming next)

- Real ABHA OTP via `POST /api/hiecm/gateway/v3/sessions`
- M1 milestone: patient identity
- M2 milestone: HIP record push
- M3 milestone: HIU consent-based record pull
