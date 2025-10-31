const axios = require('axios');

const createHttpClient = ({ baseURL, headers = {}, timeout = 15000 } = {}) => {
  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'User-Agent': 'REVERB/1.0 (https://reverb-demo.com)',
      Accept: 'application/json',
      ...headers
    }
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const { status, data } = error.response;
        error.message = `[REVERB] Upstream API error (${status}): ${typeof data === 'string' ? data : JSON.stringify(data).slice(0, 400)}`;
      } else if (error.request) {
        error.message = '[REVERB] No response received from upstream API';
      } else {
        error.message = `[REVERB] Request error: ${error.message}`;
      }
      throw error;
    }
  );

  return client;
};

module.exports = {
  createHttpClient
};


