/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Add openweathermap.org to the list of allowed domains
    domains: ["openweathermap.org"],
  },
  // ... any other existing configurations ...
};

module.exports = nextConfig; 