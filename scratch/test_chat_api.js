async function testChat() {
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Chào bạn',
        scope: 'user_portal'
      })
    });
    
    const text = await res.text();
    console.log('Status Code:', res.status);
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Error contacting chat API:', err.message);
  }
}

testChat();
