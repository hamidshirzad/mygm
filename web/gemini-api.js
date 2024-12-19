// Suggested code may be subject to a license. Learn more: ~LicenseLog:2922038672.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:1359208436.
// Example using Node.js and the 'node-fetch' library

const fetch = require('node-fetch');

async function generateText(prompt) {
  const apiKey = 'YOUR_API_KEY'; // Replace with your actual API key
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  return data.candidates[0].content;
}

async function main() {
  const prompt = 'Explain how AI works';
  const generatedText = await generateText(prompt);
  console.log(generatedText);
}

main();
