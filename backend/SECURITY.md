# Security Report — users-api (Assignment 2.5)

This report summarises the security controls added in Topic 2.5 and the residual risk that remains.

## OWASP Top 10 (2021) coverage

| # | Risk | How users-api defends (or why it does not apply yet) |
|---|------|------------------------------------------------------|
| A01 | Broken Access Control | `authenticate` plus RBAC (`requireRole`) and ABAC (`requirePermission`) ensure users can only read or change their own records unless they are admins (2.3). |
| A02 | Cryptographic Failures | Passwords are hashed with scrypt and a per-user salt, JWTs are signed with a pinned algorithm, and Helmet adds HSTS so browsers only use HTTPS in production (2.1, 2.3, 2.5). |
| A03 | Injection | Zod allow-lists every field and rejects objects such as `{ "$ne": null }`; queries are parameterised by the repository/ORM in Unit 3, and output is escaped by the React frontend (2.5). |
| A04 | Insecure Design | Threat-model-driven controls include refresh-token reuse detection and per-IP/per-account rate limits on login and registration (2.3, 2.5). |
| A05 | Security Misconfiguration | Helmet sets the core security headers, CORS uses an explicit origin allow-list, cookies are `SameSite=Strict`, and RFC 9457 Problem Details errors never leak stack traces (2.1, 2.5). |
| A06 | Vulnerable Components | Dependencies are locked in `package-lock.json`, `npm audit` is clean (0 vulnerabilities), and Dependabot alerts/updates should be enabled in GitHub. |
| A07 | Identification & Authentication Failures | Password strength rules, generic login errors, httpOnly refresh cookies and a 5-failed-attempts-per-15-minutes limiter keyed by IP + email slow credential stuffing (2.3, 2.5). |
| A08 | Software & Data Integrity Failures | JWT signatures are verified with a pinned algorithm and issuer/audience; installs should use `npm ci` with the committed lock file to avoid tampered packages (2.3). |
| A09 | Logging & Monitoring Failures | Every request gets an `X-Request-Id` that is included in logs and Problem Details responses; centralised alerting is planned for Unit 4. |
| A10 | Server-Side Request Forgery (SSRF) | The API never fetches a user-supplied URL: GitHub endpoints are hard-coded and S3 keys come from our own presigning flow (2.3, 2.4). |

## Remaining weakness

Rate-limit counters are kept in each Node process's memory, so a restart resets them and several instances behind Nginx each count separately: an attacker can multiply the effective limit by the number of instances. I would add a shared store with `rate-limit-redis` (Redis container in development, managed Redis in production) and pass it as the `store` option to both limiters, then add an integration test that starts two app instances against one Redis and asserts a shared 429.

## Short answers

**Why does CORS not protect your API from curl or a server-side attacker? What does?** CORS is a browser-enforced read restriction: the browser compares the `Access-Control-Allow-Origin` header with the calling origin, but curl, Postman and server-side scripts ignore it and can read the response directly. A non-browser attacker is stopped by authentication (a valid signed Bearer token or refresh cookie), Zod validation, authorisation policies, rate limits and the network controls around the service. CORS is useful only for limiting which browser origins may use a logged-in user's credentials; it is not an access-control mechanism.

**Our `/users` routes use Bearer tokens, `/auth/refresh` uses a cookie. Why does only the second need CSRF protection?** A browser never attaches an `Authorization: Bearer ...` header automatically: the frontend must read the token and set the header explicitly, so an attacker's page on another origin cannot forge that request with the user's token. Cookies, however, are attached automatically by the browser to matching requests, so a malicious site could submit a form or script to `/auth/refresh` and use the victim's httpOnly cookie. We therefore check the `Origin` header on the cookie routes and layer `SameSite=Strict`, `Secure` cookies and the JSON-only requirement underneath it.

**Why is allow-listing (the name regex) safer than block-listing (`if (name.includes('<script>'))`)?** Block-lists must anticipate every dangerous spelling, and attackers can bypass them with `<img onerror=...>`, mixed case, HTML entities, Unicode lookalikes or new tags/frameworks. An allow-list defines the small set of characters that is meaningful for a name (letters, marks, spaces, apostrophes, dots and hyphens), so any payload containing `<`, `>`, `=`, quotes or JavaScript syntax is rejected before it can be stored. It also fails safely: if a new attack technique appears, the input is still invalid unless it fits the narrow, expected shape.
