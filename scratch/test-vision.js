require('dotenv').config();
// Trim them just like server.js does
if (process.env.GROQ_API_KEY_VISION) process.env.GROQ_API_KEY_VISION = process.env.GROQ_API_KEY_VISION.trim();
if (process.env.GROQ_API_KEY_VISION_2) process.env.GROQ_API_KEY_VISION_2 = process.env.GROQ_API_KEY_VISION_2.trim();
if (process.env.GROQ_API_KEY_VISION_3) process.env.GROQ_API_KEY_VISION_3 = process.env.GROQ_API_KEY_VISION_3.trim();

const { callGroq, pools } = require('../server/utils/groq-rotator');

async function test() {
  console.log("Vision Pool keys:", pools.vision);
  
  if (!pools.vision || pools.vision.length === 0) {
    console.error("❌ No vision keys loaded in pools. Check your .env file and groq-rotator.js!");
    return;
  }

  console.log(`Loaded ${pools.vision.length} vision keys.`);

  // We will try calling the vision model using the rotator.
  // We can test each key by running multiple calls, or check if at least the first one works.
  try {
    console.log("Testing callGroq for 'vision' pool...");
    const res = await callGroq('vision', {
      model: 'llama-3.2-11b-vision',
      messages: [{ role: 'user', content: 'Xin chào! Hãy trả lời ngắn gọn trong 3 từ.' }],
      max_tokens: 50
    });
    console.log("✅ Success! Response:", res.choices[0].message.content);
  } catch (err) {
    console.error("❌ Error calling vision pool:", err.message || err);
  }
}

test();
