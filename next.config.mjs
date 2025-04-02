/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... other existing configurations might be here ...

  images: {
    // Append the remotePatterns array if images config exists, or create it.
    // Keep any existing patterns.
    remotePatterns: [
      // Add the new pattern for unsplash.com
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '', // Optional: Defaults to ''
        pathname: '**', // Optional: Allow any path under this hostname
      },
      // ... any other existing remote patterns ...
    ],
    // ... any other existing image configurations ...
  },

  // ... other existing configurations might be here ...
};

export default nextConfig; 