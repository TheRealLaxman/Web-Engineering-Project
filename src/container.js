import { config } from './config/env.js';
import { createAuthenticate } from './middleware/authenticate.js';
import { AuthController } from './controllers/auth.controller.js';
import { UsersController } from './controllers/users.controller.js';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository.js';
import { UsersRepository } from './repositories/users.repository.js';
import { AuthService } from './services/auth.service.js';
import { GithubOAuthClient } from './services/github-oauth.client.js';
import { TokenService } from './services/token.service.js';
import { UsersService } from './services/users.service.js';

// Composition root: the ONE place where objects are created and wired together.
//   repository → service → controller
// `overrides` lets tests swap any piece (e.g. a fake password verifier or a fake fetch).
export function createContainer(overrides = {}) {
  const usersRepository = overrides.usersRepository ?? new UsersRepository();
  const refreshTokensRepository = overrides.refreshTokensRepository ?? new RefreshTokensRepository();
  const usersService =
    overrides.usersService ??
    new UsersService(usersRepository, { hash: overrides.hashPassword, verify: overrides.verifyPassword });
  const tokenService = overrides.tokenService ?? new TokenService(refreshTokensRepository, config.auth);
  const authService = overrides.authService ?? new AuthService(usersService, tokenService);
  const githubClient =
    overrides.githubClient ?? new GithubOAuthClient(config.github, { fetch: overrides.fetch });

  const authenticate = overrides.authenticate ?? createAuthenticate(tokenService);
  const usersController = overrides.usersController ?? new UsersController(usersService);
  const authController = overrides.authController ?? new AuthController(authService, usersService, githubClient);

  return {
    usersRepository,
    refreshTokensRepository,
    usersService,
    tokenService,
    authService,
    githubClient,
    authenticate,
    usersController,
    authController,
  };
}
