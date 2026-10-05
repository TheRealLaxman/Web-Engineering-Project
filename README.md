## Assignment 2.1 — Written Questions

1: What is the responsibility of each layer in the application?

The route layer defines the API endpoints and connects requests to the correct controller. The controller layer receives HTTP requests, calls the service, and sends HTTP responses. The service layer contains the main business logic, such as checking duplicate emails and preparing user data. The repository layer handles storing, finding, updating, and deleting user records.

2: Why are arrow-function class fields used in the controller?

Arrow-function class fields are used because they automatically preserve the value of this from the class instance. Express calls controller methods as callback functions, which can cause this to lose its expected context when regular methods are used. Arrow functions prevent this problem. This allows the controller to access its service and other instance properties correctly.

3: Why is it difficult to test a controller that creates its own service?

When a controller creates its own service, it becomes tightly connected to that service and its dependencies. During testing, it is difficult to replace the real service with a mock service. This can make controller tests more complicated and may require the repository or database logic to run as well. Passing the service into the controller through its constructor would make it easier to test independently.

