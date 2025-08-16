/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Optimize bundle for serverless deployment
  experimental: {
    // Reduce bundle size by externalizing certain packages
    serverComponentsExternalPackages: [
      'chromadb',
      '@google/generative-ai',
      'openai',
      'sharp',
    ],
  },
  
  // Webpack optimization for serverless functions
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize large packages for server-side
      config.externals = config.externals || [];
      config.externals.push({
        'onnxruntime-node': 'commonjs onnxruntime-node',
        'chromadb': 'commonjs chromadb',
        'sharp': 'commonjs sharp',
      });
    }
    
    return config;
  },
  
  // Output standalone for better serverless optimization
  output: 'standalone',
};

export default config;
