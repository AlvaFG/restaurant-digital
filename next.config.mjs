import withPWA from '@ducanh2912/next-pwa';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build optimizations
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Compression
  compress: true,

  // Webpack customization
  webpack: (config, { isServer }) => {
    // Exclude Konva and react-konva from server-side bundle (they require canvas which is client-only)
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'canvas',
        'konva',
        'react-konva',
        { 'react-konva': 'react-konva' }
      ];
    }

    // Resolve canvas module for browser (Konva needs browser environment)
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        ...(isServer ? {
          'react-konva': false,
          'konva': false,
          'canvas': false,
        } : {}),
      },
      fallback: {
        ...config.resolve?.fallback,
        canvas: false,
        fs: false,
        net: false,
        tls: false,
      },
    };

    return config;
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ]
  },
}

// PWA Configuration
const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Add custom service worker code for push notifications
  sw: 'sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(js|css|woff2|woff|ttf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
};

export default withNextIntl(withPWA(pwaConfig)(nextConfig));
