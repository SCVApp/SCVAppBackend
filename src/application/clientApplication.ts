import { LogLevel, ConfidentialClientApplication } from '@azure/msal-node';
import { env } from 'process';
import * as dotenv from 'dotenv';

dotenv.config();

const config = {
  auth: {
    clientId: env.OAUTH_APP_ID,
    authority: env.OAUTH_AUTHORITY,
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
