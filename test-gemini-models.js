#!/usr/bin/env node

/**
 * Test Harness for Gemini API Models
 * 
 * This script tests which Gemini models are available with your API key.
 * Run with: node test-gemini-models.js
 * 
 * Make sure GEMINI_API_KEY is set in your .env file or as an environment variable.
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// List of models to test (in order of preference)
const MODELS_TO_TEST = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro',
    'gemini-1.0-pro-latest',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-thinking-exp',
];

async function testModel(genAI, modelName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${modelName}`);
    console.log('='.repeat(60));
    
    try {
        // Try to initialize the model
        const model = genAI.getGenerativeModel({ 
            model: modelName
        });
        
        console.log(`✓ Model "${modelName}" initialized successfully`);
        
        // Try a simple generation to verify it works
        console.log(`  → Testing with a simple prompt...`);
        const testPrompt = "Say 'Hello, this model works!' in one sentence.";
        
        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: testPrompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 100,
            },
        });
        
        const response = await result.response;
        const text = response.text();
        
        console.log(`  ✓ Generation successful!`);
        console.log(`  → Response: ${text.substring(0, 100)}...`);
        
        return {
            modelName,
            status: 'success',
            works: true,
            response: text
        };
        
    } catch (error) {
        console.log(`  ✗ Failed: ${error.message}`);
        
        // Check for specific error types
        if (error.message.includes('API_KEY')) {
            console.log(`  → Error: API key issue`);
        } else if (error.message.includes('model') || error.message.includes('Model')) {
            console.log(`  → Error: Model not available or invalid name`);
        } else if (error.message.includes('quota')) {
            console.log(`  → Error: API quota exceeded`);
        } else if (error.message.includes('permission')) {
            console.log(`  → Error: Permission denied`);
        }
        
        return {
            modelName,
            status: 'failed',
            works: false,
            error: error.message
        };
    }
}

async function runTests() {
    console.log('\n🔬 Gemini API Model Test Harness');
    console.log('='.repeat(60));
    
    // Get API key
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error('\n❌ ERROR: GEMINI_API_KEY not found!');
        console.log('\nPlease set your API key in one of these ways:');
        console.log('  1. Create a .env file with: GEMINI_API_KEY=your_key_here');
        console.log('  2. Export it: export GEMINI_API_KEY=your_key_here');
        console.log('  3. Pass it directly: GEMINI_API_KEY=your_key_here node test-gemini-models.js\n');
        process.exit(1);
    }
    
    console.log(`✓ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`✓ Testing ${MODELS_TO_TEST.length} models\n`);
    
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test each model
    const results = [];
    for (const modelName of MODELS_TO_TEST) {
        const result = await testModel(genAI, modelName);
        results.push(result);
        
        // Small delay between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const workingModels = results.filter(r => r.works);
    const failedModels = results.filter(r => !r.works);
    
    console.log(`\n✅ Working Models (${workingModels.length}):`);
    if (workingModels.length > 0) {
        workingModels.forEach(r => {
            console.log(`   • ${r.modelName}`);
        });
        console.log(`\n💡 Recommended: Use "${workingModels[0].modelName}" in your API config`);
    } else {
        console.log('   None found');
    }
    
    console.log(`\n❌ Failed Models (${failedModels.length}):`);
    if (failedModels.length > 0) {
        failedModels.forEach(r => {
            console.log(`   • ${r.modelName} - ${r.error}`);
        });
    }
    
    // Recommendations
    console.log(`\n${'='.repeat(60)}`);
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    if (workingModels.length === 0) {
        console.log('\n⚠️  No working models found. Possible issues:');
        console.log('   1. API key is invalid or expired');
        console.log('   2. API key doesn\'t have access to Gemini models');
        console.log('   3. API quota exceeded');
        console.log('   4. Network connectivity issues');
        console.log('\n   Check your API key at: https://aistudio.google.com/apikey');
    } else {
        console.log(`\n✓ Found ${workingModels.length} working model(s)!`);
        console.log(`\nTo use in your Vercel deployment:`);
        console.log(`  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables`);
        console.log(`  2. Add: GEMINI_MODEL = ${workingModels[0].modelName}`);
        console.log(`  3. Redeploy your project`);
        console.log(`\nOr update api/generate-plan.js to use: '${workingModels[0].modelName}'`);
    }
    
    console.log('\n');
}

// Run the tests
runTests().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});

