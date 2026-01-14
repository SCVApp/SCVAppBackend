import { LogLevel, ConfidentialClientApplication } from '@azure/msal-node';
import { env } from 'process';
import * as dotenv from 'dotenv';

dotenv.config();

// Build authority URL with tenant ID
// The authority URL is now tenant-specific: https://login.microsoftonline.com/{tenant-id}
const getAuthorityUrl = (): string => {
  const baseAuthority =
    env.OAUTH_AUTHORITY || 'https://login.microsoftonline.com/';
  const tenantId = env.OAUTH_TENANT_ID;

  if (!tenantId) {
    throw new Error(
      'OAUTH_TENANT_ID environment variable is required for Microsoft OAuth authentication',
    );
  }

  // Ensure base authority ends with /
  const normalizedAuthority = baseAuthority.endsWith('/')
    ? baseAuthority
    : `${baseAuthority}/`;
  return `${normalizedAuthority}${tenantId}`;
};

const config = {
  auth: {
    clientId: env.OAUTH_APP_ID,
    authority: getAuthorityUrl(),
    clientSecret: env.OAUTH_APP_CLIENT_SECRET, // Only for Confidential Client Applications
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Verbose || 3,
    },
  },
};

const clientApplication = new ConfidentialClientApplication(config);

export default clientApplication;
