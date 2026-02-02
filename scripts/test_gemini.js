const fs = require('fs');
const path = require('path');

// Load env specific to local
const envPath = path.join(__dirname, '../.env.local');
let apiKey = null;

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim().replace(/^["']|["']$/g, '');
    }
} catch (e) {
    console.error("Could not read .env.local:", e.message);
}

if (!apiKey) {
    console.error("No GEMINI_API_KEY found in ../.env.local");
    process.exit(1);
}

console.log(`Using API Key: ${apiKey.substring(0, 5)}...`);

async function listModels() {
    console.log("Fetching available models from API...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API Error:", JSON.stringify(data.error, null, 2));
            process.exit(1);
        }

        if (!data.models || data.models.length === 0) {
            console.error("❌ No models returned by API.");
            process.exit(1);
        }

        console.log("✅ Available Models:");
        const validModels = [];
        data.models.forEach(m => {
            // Check if it supports generateContent
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                console.log(` - ${m.name}`);
                validModels.push(m.name);
            }
        });

        fs.writeFileSync(path.join(__dirname, '../models.json'), JSON.stringify(validModels, null, 2));
        console.log("Written to models.json");
        process.exit(0);

    } catch (e) {
        console.error("❌ Fetch failed:", e);
        process.exit(1);
    }
}

listModels();
