// Configuration for OTP endpoints
export const config = {
  // Default to localhost, can be overridden by environment variable
  baseUrl: process.env.OTP_BASE_URL || 'http://localhost:8080',

  // GraphQL endpoint paths
  gtfsPath: '/otp/gtfs/v1',
  transmodelPath: '/otp/transmodel/v3',

  // Which API to use ('gtfs' or 'transmodel')
  apiType: process.env.OTP_API_TYPE || 'gtfs',

  // Request timeout in milliseconds
  timeout: 30000,

  // Delay between tests in milliseconds
  testDelay: 500
};

// Helper to get full endpoint URL
export function getEndpointUrl() {
  const path = config.apiType === 'gtfs' ? config.gtfsPath : config.transmodelPath;
  return `${config.baseUrl}${path}`;
}

// Available presets
export const presets = {
  localhost: 'http://localhost:8080',
  deployed: 'https://ctp-otp.etch.app'
};

// Check if using deployed version
export function isDeployedVersion() {
  return config.baseUrl.includes('etch.app');
}