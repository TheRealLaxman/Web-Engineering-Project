import { config } from './config/env.js';
import { createAuthenticate } from './middleware/authenticate.js';
import { AuthController } from './controllers/auth.controller.js';
import { AvatarController } from './controllers/avatar.controller.js';
import { UsersController } from './controllers/users.controller.js';
import { createImageUpload } from './middleware/upload.js';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository.js';
import { UsersRepository } from './repositories/users.repository.js';
import { AuthService } from './services/auth.service.js';
import { AvatarService } from './services/avatar.service.js';
import { GithubOAuthClient } from './services/github-oauth.client.js';
import { ImageService } from './services/image.service.js';
import { TokenService } from './services/token.service.js';
import { UsersService } from './services/users.service.js';
import { LocalDiskStorage } from './storage/local-disk.storage.js';
import { S3Storage } from './storage/s3.storage.js';

// Pick the storage implementation from config. Both have the same methods (put/get/delete/...).
function createStorage(uploads) {
  if (uploads.driver === 's3') return new S3Storage(config.s3);
  return new LocalDiskStorage({ dir: uploads.localDir, publicBaseUrl: uploads.publicBaseUrl });
}

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

  const uploads = { ...config.uploads, ...overrides.uploads };
  const storage = overrides.storage ?? createStorage(uploads);
  const avatarService =
    overrides.avatarService ??
    new AvatarService(usersService, new ImageService(), storage, { maxBytes: uploads.maxBytes });

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
    storage,
    uploads,
    avatarService,
    avatarController: overrides.avatarController ?? new AvatarController(avatarService),
    avatarUpload: overrides.avatarUpload ?? createImageUpload({ fieldName: 'avatar', maxBytes: uploads.maxBytes }),
  };
}
