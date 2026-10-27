export const settings = {
  /**
   * true: use in-browser fake data (no backend needed).
   * false: call the real services through the API Gateway at `apiUrl`.
   * Override with VITE_USE_MOCK_API=false in a .env file.
   */
  useMockApi: import.meta.env.VITE_USE_MOCK_API !== 'false',

  /** Base path of the YARP API Gateway, which routes to each service. */
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',
};
