# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities in public issues, pull requests, or comments.

If GitHub private vulnerability reporting is enabled for this repository, use that feature from the repository Security tab. Otherwise, contact the repository owner through a trusted private channel and include:

- The affected URL, file, or feature.
- A short description of the issue.
- Steps to reproduce, if available.
- Any logs or screenshots that do not expose secrets.

## Sensitive Data Rules

Never commit passwords, API keys, private keys, access tokens, session cookies, database URLs, Clerk secrets, Vercel tokens, database connection strings, Terraform credentials, or `.env` files. If a secret is accidentally committed, treat it as compromised, revoke it immediately, rotate it, and remove it from Git history if needed.

Frontend variables prefixed with `VITE_` are not private. Only use them for values that are safe to expose in the browser.

## Supported Branch

Security fixes are handled on the `main` branch.
