# AINOS Admin Panel

Standalone admin panel for AINOS Business Suite.

## Features

- **Company Onboarding Management**
  - Review pending company registrations
  - Approve/reject/suspend companies
  - Document verification with preview
  - Email notifications on status changes

- **User Management** (Coming Soon)
  - View all users
  - Role management
  - Account suspension

- **Analytics Dashboard** (Coming Soon)
  - Revenue tracking
  - User growth metrics
  - Platform usage stats

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your values:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `ADMIN_EMAILS` - Comma-separated admin email addresses
- `RESEND_API_KEY` - Resend API key for email notifications
- Cloudinary credentials for document uploads

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Build

```bash
npm run build
npm start
```

## Deployment

Deploy to Render, Vercel, or any Node.js hosting platform.

### Render
1. Create new Web Service
2. Connect GitHub repo
3. Set environment variables
4. Deploy

## Project Structure

```
ainos-admin/
├── src/
│   ── app/
│       ├── admin/
│       │   └── onboarding/
│       │       └── page.tsx          # Admin onboarding UI
│       ├── api/
│       │   └── admin/
│       │       └── onboarding/
│       │           ├── route.ts      # List companies API
│       │           └── [companyId]/
│       │               └── route.ts  # Company actions API
│       ├── globals.css
│       ├── layout.tsx
│       ── page.tsx                  # Admin dashboard
├── package.json
├── next.config.js
── tsconfig.json
└── .env.example
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (via Prisma)
- **Auth:** NextAuth.js
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Email:** Resend API
- **File Storage:** Cloudinary

## License

Private - Yurekh Solutions Private Limited