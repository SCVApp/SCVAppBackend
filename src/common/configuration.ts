import { readFileSync } from 'fs';

type Configuration = {
  JWT_PRIVATE_KEY: string;
  JWT_PUBLIC_KEY: string;
};

function configuration(): Configuration {
  return {
    JWT_PRIVATE_KEY: readFileSync('src/certs/jwtRS256.key', 'utf8'),
    JWT_PUBLIC_KEY: readFileSync('src/certs/jwtRS256.key.pub', 'utf8'),
  };
}

export default configuration;
