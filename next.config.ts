
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const isProd = process.env.NODE_ENV === 'production';

const withPWA = withPWAInit({
  dest: 'public',
  disable: !isProd,
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      
    ],
  },
};

export default withPWA(nextConfig);
