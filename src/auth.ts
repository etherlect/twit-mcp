import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const CLAUDE_CONFIG_PATH = process.platform === 'win32'
  ? join(process.env.APPDATA ?? homedir(), 'Claude', 'claude_desktop_config.json')
  : join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');

export type TwitterCredentials = {
  authToken: string;
  ct0: string;
  username?: string;
};

export function loadCredentials(): TwitterCredentials | null {
  const authToken = process.env.TWITTER_AUTH_TOKEN;
  const ct0 = process.env.TWITTER_CT0;
  if (!authToken || !ct0) return null;
  return { authToken, ct0, username: process.env.TWITTER_USERNAME };
}

function findServerKey(servers: Record<string, any>): string {
  const thisProcess = process.argv[1] ?? '';

  // 1. Exact path match
  const exactMatch = Object.keys(servers).find((k) =>
    servers[k]?.args?.some((a: string) => a === thisProcess)
  );
  if (exactMatch) return exactMatch;

  // 2. Package name match (twit-mcp or twit)
  const pkgMatch = Object.keys(servers).find((k) =>
    servers[k]?.args?.some((a: string) => a === 'twit-mcp' || a === 'twit')
  );
  if (pkgMatch) return pkgMatch;

  throw new Error('Could not find twit-mcp entry in Claude Desktop config. Make sure the server is registered as "twit" or "twit-mcp" in your mcpServers config.');
}

export function saveCredentials(creds: TwitterCredentials): void {
  const raw = readFileSync(CLAUDE_CONFIG_PATH, 'utf8');
  const config = JSON.parse(raw);

  const servers = config.mcpServers ?? {};
  const key = findServerKey(servers);

  if (!config.mcpServers) config.mcpServers = {};
  if (!config.mcpServers[key]) config.mcpServers[key] = {};
  if (!config.mcpServers[key].env) config.mcpServers[key].env = {};

  config.mcpServers[key].env.TWITTER_AUTH_TOKEN = creds.authToken;
  config.mcpServers[key].env.TWITTER_CT0 = creds.ct0;
  if (creds.username) config.mcpServers[key].env.TWITTER_USERNAME = creds.username;

  writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

export function clearCredentials(): void {
  const raw = readFileSync(CLAUDE_CONFIG_PATH, 'utf8');
  const config = JSON.parse(raw);

  const servers = config.mcpServers ?? {};
  const key = findServerKey(servers);

  if (config.mcpServers?.[key]?.env) {
    delete config.mcpServers[key].env.TWITTER_AUTH_TOKEN;
    delete config.mcpServers[key].env.TWITTER_CT0;
    delete config.mcpServers[key].env.TWITTER_USERNAME;
  }

  writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

export { CLAUDE_CONFIG_PATH as CREDS_PATH };
