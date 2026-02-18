/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable Turbopack as suggested by the error message
    turbopack: {},

    // We can keep headers for security if needed, but the WASM specific ones 
    // (Cross-Origin-Opener-Policy, etc.) are likely only needed for browser-side encodings.
    // I'll keep them just in case other libraries need SharedArrayBuffer, 
    // but simplified the rest.
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
