// Test the face-swap function deployment
const url = 'https://mtyjgrgldlpglzmqyucw.supabase.co/functions/v1/face-swap';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWpncmdsZGxwZ2x6bXF5dWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzY1MjEsImV4cCI6MjA4OTQ1MjUyMX0.xtuNb8tylZBocP1LhkG7KcoIek2Wh3MFi6KrV9Yew0E';

// Test OPTIONS request (CORS preflight)
fetch(url, {
  method: 'OPTIONS',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'apikey': anonKey
  }
})
.then(response => {
  console.log('OPTIONS Response Status:', response.status);
  console.log('CORS Headers:', {
    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
  });
})
.catch(error => {
  console.error('OPTIONS Error:', error);
});

// Test POST request
fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'apikey': anonKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    sourceImageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    targetImageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  })
})
.then(response => {
  console.log('POST Response Status:', response.status);
  return response.text();
})
.then(text => {
  console.log('POST Response Body:', text);
})
.catch(error => {
  console.error('POST Error:', error);
});
