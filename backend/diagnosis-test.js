const url = (path) => `http://127.0.0.1:5000${path}`;

(async () => {
  try {
    const healthRes = await fetch(url('/api/health'));
    console.log('/api/health', healthRes.status, await healthRes.text());

    const loginRes = await fetch(url('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Admin@1234'
      })
    });

    console.log('/api/auth/login', loginRes.status);
    const loginData = await loginRes.json().catch(() => null);
    console.log('loginData', loginData);

    if (!loginRes.ok || !loginData?.token) {
      process.exit(0);
    }

    const diagRes = await fetch(url('/api/farmer/diagnose'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        diagnosisCategory: 'crop',
        cropType: 'tomato',
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
      })
    });

    console.log('/api/farmer/diagnose', diagRes.status);
    const diagData = await diagRes.json().catch(() => null);
    console.log('diagnoseData', diagData);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();