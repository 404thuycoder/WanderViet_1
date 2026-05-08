const axios = require('axios');

async function test() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJ1c2luZXNzNTI2MjM4ODciLCJfaWQiOiI2OWY2ZGM5YjU0Y2NkYjc3ODAyNWFmNTYiLCJjdXN0b21JZCI6ImJ1c2luZXNzNTI2MjM4ODciLCJwb3J0YWwiOiJidXNpbmVzcyIsInJvbGUiOiJidXNpbmVzcyIsImlhdCI6MTc3ODI1MTczOH0.UNhzEsGwFnoh2c7fQ_8MIOcURYtjMW3PJxMuz2iZZuo';
  
  try {
    const res = await axios.post('http://localhost:3000/api/business/places', {
      name: 'PENDING TEST FROM SCRIPT',
      kind: 'khach-san',
      region: 'Hạ Long'
    }, {
      headers: { 'x-auth-token': token }
    });
    console.log('Response:', res.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
