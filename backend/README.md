## Assignment 2.1 — Written Questions

1: What is the responsibility of each layer in the application?

The route layer defines the API endpoints and connects requests to the correct controller. The controller layer receives HTTP requests, calls the service, and sends HTTP responses. The service layer contains the main business logic, such as checking duplicate emails and preparing user data. The repository layer handles storing, finding, updating, and deleting user records.

2: Why are arrow-function class fields used in the controller?

Arrow-function class fields are used because they automatically preserve the value of this from the class instance. Express calls controller methods as callback functions, which can cause this to lose its expected context when regular methods are used. Arrow functions prevent this problem. This allows the controller to access its service and other instance properties correctly.

3: Why is it difficult to test a controller that creates its own service?

When a controller creates its own service, it becomes tightly connected to that service and its dependencies. During testing, it is difficult to replace the real service with a mock service. This can make controller tests more complicated and may require the repository or database logic to run as well. Passing the service into the controller through its constructor would make it easier to test independently.

## Assignment 2.2 — Written Questions

1. What happens if a middleware never calls `next()` and never sends a response? What would a form-encoded `POST /api/v1/users` return if `requireJson` were registered after `app.use('/api/v1/users', ...)`, and why?

If a middleware neither calls `next()` nor sends a response, the request is left open and the client hangs until it times out. Express does not automatically continue to the next handler, so the pipeline simply stops at that middleware. If `requireJson` were registered after the users router, a form-encoded POST would already have been handled by the router: `express.json()` would ignore the form body, `req.body` would be undefined, and `validateBody` would reject it with 400 "Request body must be a JSON object". The 415 response never happens because middleware registered after a route only runs when an earlier handler explicitly passes control to it.

2. Explain Dependency Injection in your own words, using your `container.js` as the example.

Dependency Injection means an object receives the collaborators it needs instead of constructing them itself. In `src/container.js`, `createContainer()` is the composition root: it creates a `UsersRepository`, passes it into `UsersService`, then passes that service into `UsersController`, and returns all three. Production calls `createContainer()` with no arguments, while tests can pass `overrides` such as a fake `hashPassword` or a fake `usersService`. This keeps the controller loosely coupled and makes it possible to test layers in isolation or swap the in-memory repository for PostgreSQL later.

3. Name two tests in Part C that could not be written with the Assignment 2.1 code, and explain why.

The `users.controller.test.js` tests could not be written in 2.1 because `UsersController` constructed its own `UsersService` and repository internally, so there was no way to inject the `vi.fn()` fake service and assert calls to it. Likewise, the integration test "POST → 201, and the injected hasher was used" would be impossible because the service always used the real scrypt hasher and every controller instance shared one in-memory Map, so tests could not inject `fake-hash:${plain}` or guarantee a fresh empty store per test. The "a fake service can replace the real one entirely" test is another clear example for the same reason.

## Assignment 2.3 — Written Questions

1. What is the difference between authentication and authorization, and where is each enforced in the code?

Authentication answers "who are you?" while authorization answers "what are you allowed to do?". Authentication is enforced by `createAuthenticate()` in `src/middleware/authenticate.js`: it reads the `Authorization: Bearer <token>` header, verifies the JWT through `TokenService.verifyAccessToken()`, and sets `req.user = { id, role }` or returns 401. Authorization runs afterwards in `src/middleware/authorize.js`: `requireRole()` implements RBAC by checking `req.user.role` against an allowed list, and `requirePermission()` implements ABAC by calling `can()` from `src/auth/policies.js` with the actor and resource attributes. The routes in `src/routes/users.routes.js` apply them, for example admin-only `GET /users` and ownership-based `GET /users/:id`.

2. Why is the refresh token stored in an httpOnly, sameSite cookie while the access token is returned in JSON?

The access token is short-lived (15 minutes) and must be readable by JavaScript so the client can attach it as a Bearer header; it is not useful for long if stolen. The refresh token lives for days and can mint new access tokens, so exposing it to JavaScript would make an XSS attack much more damaging. `httpOnly` means page scripts cannot read it, `sameSite=strict` stops other sites from sending it with cross-site requests (CSRF), and `secure` is enabled in production so it only travels over HTTPS. The cookie is also scoped to `path=/api/v1/auth`, so it is not sent to unrelated routes. `AuthController.#sendSession()` in `src/controllers/auth.controller.js` sets these options.

3. What is refresh-token rotation with reuse detection, and why is it safer than a long-lived static refresh token?

Rotation means every time a refresh token is used, `TokenService.rotateRefreshToken()` issues a brand-new token for the same family and immediately revokes the old one, recording `revokedAt` and `replacedBy`. Only SHA-256 hashes are stored in `RefreshTokensRepository`, never the raw token. Reuse detection means if an already-revoked token is presented again, the service assumes it was copied by an attacker and calls `revokeFamily()` to kill every token derived from that login, forcing both the legitimate user and the attacker to log in again. A static long-lived token would keep working indefinitely after a single leak; rotation limits the window and turns a leak into a detectable event.

4. How do the OAuth `state` parameter and PKCE protect the GitHub login flow?

`state` is a random value created by `createState()` in `src/auth/pkce.js`, stored in a short-lived httpOnly cookie, and sent to GitHub. The callback compares it with `?state=...`; a mismatch means the login was started by another site, so it is rejected as CSRF/login forgery. PKCE adds a second secret: `createPkcePair()` keeps a random `verifier` in the same cookie and sends only its SHA-256 `code_challenge` to GitHub. When exchanging the one-time code, the server sends the original `verifier`; GitHub checks the hash. An attacker who only steals the authorization `code` cannot redeem it without the verifier. Both are one-time, and the cookie is cleared in `githubCallback()`.

## Assignment 2.4 — Written Questions

1. Why do we check the image bytes with Sharp when Multer already checked the Content-Type? Give an attack that the second check stops.

Multer's `fileFilter` only checks the client-declared `Content-Type` and filename, both of which an attacker fully controls. For example, a PHP webshell or an SVG containing `<script>` can be renamed to `shell.png` and sent as `image/png`, so Multer accepts it. `sharp().metadata()` inspects the actual magic bytes, rejects non-images with 400, and rejects SVG with 415. Re-encoding every accepted image into fresh WebP also means embedded scripts or unexpected payloads never reach storage.

2. Compare uploading through the API with presigned URLs: when would you choose each?

Uploading through the API is simple, works with local disk, and lets us validate and process the file before storing it, but all bytes pass through the server and consume memory and bandwidth. A presigned URL sends the browser directly to S3, so the API only handles a small JSON request and the later processing step; this is much better for large or high-volume files. Choose the API for small avatars and local development, and presigned URLs for production media at scale. With presigned uploads we must re-check ownership, declared size, and actual image bytes in `/complete`, because validation happens after the browser has already uploaded the raw object.

3. Name three things our pipeline does to the image and why each matters (performance, privacy, security).

`rotate()` applies the EXIF orientation so phone photos appear upright. `resize()` creates square 64, 256 and 512 px crops so the browser downloads only the size it needs, improving performance and keeping the UI consistent. Re-encoding to WebP at quality 80 makes files much smaller, while Sharp drops metadata by default so EXIF GPS and camera details do not leak. This re-encoding also destroys any malicious content hidden in the original file, which is an important security benefit.

4. Why does every upload get a new random version in its filename?

A new UUID version produces a new URL for every avatar upload, so browsers and CDNs cannot serve a stale cached image after a profile picture changes. Because the key is unique, we can safely mark uploads as immutable and cache them for a year. Random server-generated names also avoid using user-controlled filenames in paths and reduce the chance of collisions while old files are being deleted.

