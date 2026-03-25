const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listAvailableModels() {
  console.log('Checking available Gemini models...');
  console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try different API versions and models
    const modelsToTry = [
      { version: 'v1beta', model: 'gemini-1.5-flash' },
      { version: 'v1beta', model: 'gemini-1.5-pro' },
      { version: 'v1', model: 'gemini-pro' },
      { version: 'v1', model: 'gemini-1.5-flash' },
      { version: 'v1', model: 'gemini-1.5-pro-latest' },
      { version: 'v1', model: 'text-bison-001' },
      { version: 'v1', model: 'chat-bison-001' }
    ];
    
    for (const { version, model } of modelsToTry) {
      try {
        console.log(`\nTrying ${version}/${model}...`);
        
        // Try to get the model
        const testModel = genAI.getGenerativeModel({ model, generationConfig: { version } });
        
        // Try a simple generation
        const result = await testModel.generateContent("Hello");
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ SUCCESS: ${version}/${model}`);
        console.log(`Response: ${text.substring(0, 100)}...`);
        
        // If successful, update the service files
        console.log(`\n🎯 Found working model: ${version}/${model}`);
        console.log('Updating AI service files...');
        
        // Update the AI service
        const fs = require('fs');
        const path = require('path');
        
        // Update aiService.js
        let aiServiceContent = fs.readFileSync(path.join(__dirname, 'services/aiService.js'), 'utf8');
        aiServiceContent = aiServiceContent.replace(
          /this\.model = genAI\.getGenerativeModel\({ model: "[^"]+" }\)/,
          `this.model = genAI.getGenerativeModel({ model: "${model}" })`
        );
        fs.writeFileSync(path.join(__dirname, 'services/aiService.js'), aiServiceContent);
        
        // Update test-gemini.js
        let testContent = fs.readFileSync(path.join(__dirname, 'test-gemini.js'), 'utf8');
        testContent = testContent.replace(
          /const model = genAI\.getGenerativeModel\({ model: "[^"]+" }\)/,
          `const model = genAI.getGenerativeModel({ model: "${model}" })`
        );
        fs.writeFileSync(path.join(__dirname, 'test-gemini.js'), testContent);
        
        console.log('✅ Files updated successfully!');
        return model;
        
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
      }
    }
    
    console.log('\n❌ No working models found. Using enhanced pattern matching instead.');
    return null;
    
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    return null;
  }
}

listAvailableModels().then(workingModel => {
  if (workingModel) {
    console.log(`\n🎉 Success! Using model: ${workingModel}`);
  } else {
    console.log('\n⚠️ Falling back to enhanced pattern matching analysis');
  }
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
