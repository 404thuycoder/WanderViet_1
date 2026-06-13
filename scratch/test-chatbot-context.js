async function testChatFlow() {
  console.log("Sending first message...");
  const res1 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "hoàng sa trường sa là của nước nào", lang: "vi", scope: "user_portal" })
  });
  const data1 = await res1.json();
  console.log("Response 1:", JSON.stringify(data1, null, 2));

  const sessionId = data1.sessionId;
  if (!sessionId) {
    console.error("No sessionId returned from the first response.");
    return;
  }

  console.log(`\nSending second message 'có' with sessionId: ${sessionId}...`);
  const res2 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "có", lang: "vi", sessionId: sessionId, scope: "user_portal" })
  });
  const data2 = await res2.json();
  console.log("Response 2:", JSON.stringify(data2, null, 2));
}

testChatFlow().catch(console.error);
