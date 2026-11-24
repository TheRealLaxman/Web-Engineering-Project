import { createApp } from './app.js';
import { config } from './config/env.js';
import { createContainer } from './container.js';
import { bootstrapAdmin } from './data/bootstrap-admin.js';

const container = createContainer();
await bootstrapAdmin(container.usersService, config.admin);
const app = createApp(container);

if (!container.githubClient.isConfigured) {
  console.log('ℹ GitHub login disabled: set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to enable it.');
}

const server = app.listen(config.port, config.host, () => {
  console.log(`👤 Users API on http://${config.host}:${config.port} (${config.env}, pid ${process.pid})`);
});

function shutdown(signal) {
  console.log(`${signal} received — shutting down`);
  server.close(() => process.exit(0));
  server.closeIdleConnections();
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
