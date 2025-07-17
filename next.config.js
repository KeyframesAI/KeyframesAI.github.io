/** @type {import('next').NextConfig} */
const nextConfig = {}

//module.exports = nextConfig

module.exports = {
      webpack: (config, { isServer }) => {
        if (!isServer) {
          config.resolve.fallback = {
            fs: false, // Prevents bundling of fs module on the client-side
            path: false, // Prevents bundling of path module on the client-side
            // Add other Node.js-specific modules as needed
          };
        }
        return config;
      },
    };
