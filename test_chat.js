

async function testChat() {
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "hạ long có tour du lịch nào", lang: "vi" })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

testChat();
