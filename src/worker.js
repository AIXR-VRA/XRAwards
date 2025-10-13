export default {
  async fetch(request, env) {
    // Default to serving static assets
    return env.ASSETS.fetch(request);
  },
};
