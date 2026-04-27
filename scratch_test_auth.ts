async function testAuthApi() {
  const url = 'http://localhost:3000/api/auth';
  const credentials = Buffer.from('admin:password123').toString('base64');

  const payload = {
    reportID: 'REP-001',
    userID: 'USR-42'
  };

  console.log('--- Testing Auth API ---');
  console.log('URL:', url);
  console.log('Payload:', JSON.stringify(payload));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json() as any;
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.token) {
      console.log('SUCCESS: Generated Token:', data.token);
    } else {
      console.log('FAILED: No token received');
    }
  } catch (error: any) {
    console.error('ERROR during request:', error.message || error);
    console.log('Note: Make sure the Next.js dev server is running on port 3000');
  }
}

testAuthApi();
