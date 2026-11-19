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

