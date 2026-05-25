// Test chat API với tin nhắn thực tế để xem lỗi chi tiết
async function testChat(msg) {
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, scope: 'user_portal' })
    });
    const data = await res.json();
    console.log(`\n=== TEST: "${msg}" ===`);
    console.log('Status:', res.status);
    console.log('Success:', data.success);
    console.log('Source:', data.source);
    console.log('Answer (100 chars):', (data.answer || '').substring(0, 100));
    if (!data.success) console.log('FULL RESPONSE:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

(async () => {
  await testChat('chào');                           // quick-response path
  await testChat('đi đà nẵng 3 ngày thì sao');     // itinerary + groq path
  await testChat('có gì hay ở hội an không');       // knowledge/groq path
})();
