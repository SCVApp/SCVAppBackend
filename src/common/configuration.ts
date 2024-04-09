import { readFileSync } from 'fs';

export default () => ({
  JWT_PRIVATE_KEY: readFileSync('src/certs/jwtRS256.key', 'utf8'),
  JWT_PUBLIC_KEY: readFileSync('src/certs/jwtRS256.key.pub', 'utf8'),
});
