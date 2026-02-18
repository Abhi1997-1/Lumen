/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable Turbopack - use webpack for @xenova/transformers WASM compatibility
    // To re-enable Turbopack later, remove this and add: turbopack: {}

    webpack: (config, { isServer }) => {
        // Enable WebAssembly
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
        };

        // Handle WASM files
        config.module.rules.push({
            test: /\.wasm$/,
            type: 'asset/resource',
        });

        // Fixes for ONNX Runtime (used by transformers.js)
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            crypto: false,
        };

        // Exclude server-only modules on client
        if (!isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                'sharp$': false,
                'onnxruntime-node$': false,
            };
        }

        return config;
    },

    // Headers for SharedArrayBuffer (WASM threading)  
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
