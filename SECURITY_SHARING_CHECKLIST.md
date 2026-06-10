# Security Sharing Checklist

Use this checklist before granting repository access to an external reviewer.

## Repository Access

- [ ] Repository is private.
- [ ] Reviewer is added with **Read** permission only.
- [ ] Reviewer is not granted Write, Maintain, or Admin access.
- [ ] Vercel, Clerk, and GitHub owner/admin access are not shared.
- [ ] Access will be removed after the review period.

## Files And Secrets

- [ ] `.env` is not committed.
- [ ] `.env.local` is not committed.
- [ ] `.data/` is not committed.
- [ ] `node_modules/` is not committed.
- [ ] `dist/` is not committed.
- [ ] `BACKUPS/` is not committed.
- [ ] No passwords, API keys, private tokens, or client data are committed.
- [ ] `.env.example` contains placeholders only.

## Reviewer Instructions

Give reviewers:

- GitHub repository link
- read-only access
- `README.md`
- `CODE_SHARING_GUIDE.md`
- `CONFIDENTIALITY_NOTICE.md`
- `.env.example`

Do not give reviewers:

- production credentials
- personal access tokens
- Vercel project ownership
- Clerk dashboard access
- private email approval lists

## Local Run

```cmd
npm install
npm run dev
```

Optional local API:

```cmd
npm run api
```

## Recommended Corporate Process

1. Execute NDA or written confidentiality terms.
2. Grant read-only GitHub access.
3. Provide Vercel demo link for product walkthrough.
4. Remove GitHub access after technical review.
5. For production discussions, move to client-controlled VPC / private cloud architecture.

