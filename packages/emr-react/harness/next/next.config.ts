import type { NextConfig } from 'next';

// The config VCMS apps/web needs to consume emr-react through react-native-web.
const webExtensions = ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.mjs', '.json'];

const nextConfig: NextConfig = {
  transpilePackages: ['react-native', 'react-native-web', '@drguptavivek/emr-react', '@drguptavivek/emr-controller'],
  turbopack: {
    resolveAlias: { 'react-native': 'react-native-web' },
    resolveExtensions: webExtensions,
  },
  webpack: config => {
    config.resolve.alias = { ...config.resolve.alias, 'react-native$': 'react-native-web' };
    config.resolve.extensions = ['.web.tsx', '.web.ts', '.web.js', ...config.resolve.extensions];
    return config;
  },
};

export default nextConfig;
