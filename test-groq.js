require('dotenv').config();
const { callGroq, pools } = require('./server/utils/groq-rotator');

async function test() {
  console.log("Pools config:", JSON.stringify(pools, null, 2));
  
  try {
    console.log("Testing callGroq for 'planner'...");
    const res = await callGroq('planner', {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Say hello in 3 words.' }],
      max_tokens: 50
    });
    console.log("Success! Response:", res.choices[0].message.content);
  } catch (err) {
    console.error("Error calling planner:", err);
  }

  try {
    console.log("Testing callGroq for 'user_chatbot'...");
    const res = await callGroq('user_chatbot', {
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'Say hello in 3 words.' }],
      max_tokens: 50
    });
    console.log("Success! Response:", res.choices[0].message.content);
  } catch (err) {
    console.error("Error calling user_chatbot:", err);
  }
}

test();
