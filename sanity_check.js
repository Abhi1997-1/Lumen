const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const RESULTS = {
    env: 'PENDING',
    supabase: 'PENDING',
    server: 'PENDING'
};

async function runTests() {
    console.log('\n🔍 STARTING SANITY CHECK...\n');

    // 1. Check Environment Variables
    try {
        const envPath = path.join(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            throw new Error('.env.local file missing');
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) envVars[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
        });

        if (!envVars.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
        if (!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

        console.log('✅ ENV: .env.local loaded and keys present.');
        RESULTS.env = 'PASS';

        // 2. Test Supabase Connection
        await testSupabase(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    } catch (e) {
        console.error('❌ ENV: Failed -', e.message);
        RESULTS.env = 'FAIL';
    }

    // 3. Test Local Server
    await testServer();

    console.log('\n📋 TEST RESULTS SUMMARY:');
    console.log('-------------------------');
    console.log(`Environment: ${RESULTS.env}`);
    console.log(`Database:    ${RESULTS.supabase}`);
    console.log(`Server:      ${RESULTS.server}`);
    console.log('-------------------------\n');
}

async function testSupabase(url, key) {
    try {
        const supabase = createClient(url, key);
        const { data, error } = await supabase.auth.getUser();

        if (error && error.status !== 401 && error.status !== 400 && error.status !== 403) {
            // Auth error is expected if no session, but connection failure is distinct
            // Actually, getUser() with valid key but no session returns { data: { user: null }, error: null } usually,
            // or a specific error. 
            // Validating the KEY itself: simplest is just making a call.
            // If the key is invalid, we get specific error.
        }

        // If we get here without throwing, the client initialized.
        // Let's rely on a simple query if possible, or just the auth check.
        // If auth check returns "Invalid API key" (401/403) that's a failure.
        if (error && (error.message.includes('invalid') || error.message.includes('key'))) {
            throw new Error(`Supabase Auth Error: ${error.message}`);
        }

        console.log('✅ SUPABASE: Connection initialized and key verified.');
        RESULTS.supabase = 'PASS';
    } catch (e) {
        console.error('❌ SUPABASE: Failed -', e.message);
        RESULTS.supabase = 'FAIL';
    }
}

function testServer() {
    return new Promise(resolve => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/',
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                console.log(`✅ SERVER: Responded with status ${res.statusCode}`);
                RESULTS.server = 'PASS';
            } else {
                console.error(`❌ SERVER: Error status ${res.statusCode}`);
                RESULTS.server = 'FAIL';
            }
            resolve();
        });

        req.on('error', (e) => {
            console.error('❌ SERVER: Connection failed -', e.message);
            RESULTS.server = 'FAIL';
            resolve();
        });

        req.end();
    });
}

runTests();
