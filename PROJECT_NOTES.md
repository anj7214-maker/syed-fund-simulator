# SYED FUND SIMULATOR Project Notes

## Public Share Link

Share this link with users:

https://syed-fund-simulator.vercel.app

Users must sign in before accessing the dashboard.

## Access Control

Authentication is handled by Clerk.

Approved-email access is controlled in Vercel:

Vercel -> syed-fund-simulator -> Settings -> Environment Variables

Edit this variable to add or remove approved users:

```text
VITE_APPROVED_EMAILS
```

Use comma-separated email addresses:

```text
owner@example.com,client@example.com,viewer@company.com
```

After editing the approved email list, redeploy the project in Vercel so the updated list takes effect.

## Required Vercel Environment Variables

```text
VITE_CLERK_PUBLISHABLE_KEY
VITE_APPROVED_EMAILS
```

Do not commit Clerk secret keys or `.env` files to GitHub.

## GitHub Repository

https://github.com/anj7214-maker/syed-fund-simulator

## Local Development

```cmd
cd "C:\Users\Syed\Documents\Codex\2026-05-09\build-a-production-grade-institutional-hedge"
npm install
npm run dev
```

Local app URL:

http://127.0.0.1:5173
