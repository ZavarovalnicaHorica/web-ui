export const settings = {
  /**
   * true: use in-browser fake data (no backend needed).
   * false: call the real services through `apiUrl`.
   */
  useMockApi: true,

  /** Base path for the REST APIs, routed to each service by the Kubernetes Ingress. */
  apiUrl: '/api',
};
