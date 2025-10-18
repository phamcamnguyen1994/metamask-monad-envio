/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are available by default in Next.js 14+
  // experimental: { serverActions: true } // Remove this line
  
  // Exclude Hardhat project from build
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.ts$/,
      exclude: /node_modules/,
      include: /monad-erc20/,
      use: 'ignore-loader'
    });
    return config;
  },
  
  // Exclude directories from build
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        './monad-erc20/**/*',
        './envio/**/*',
        './contracts/**/*',
        './scripts/**/*',
        './tests/**/*'
      ]
    }
  }
};
export default nextConfig;

