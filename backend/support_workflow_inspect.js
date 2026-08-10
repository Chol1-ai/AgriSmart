const base = 'http://127.0.0.1:5000/api';
const requestJson = async (path, options = {}) => {
  const res = await fetch(`${base}${path}`, options);
  const text = await res.text();
  const body = (() => {
    try { return JSON.parse(text); } catch { return text; }
  })();
  return { status: res.status, body };
};

const main = async () => {
  try {
    const email = process.argv[2];
    if (!email) {
      console.error('Usage: node support_workflow_inspect.js <email>');
      process.exit(1);
    }
    const adminLogin = await requestJson('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Admin@1234' })
    });
    const adminToken = adminLogin.body?.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };
    const adminSupport = await requestJson('/admin/support', { headers: adminHeaders });
    console.log('admin support count', Array.isArray(adminSupport.body) ? adminSupport.body.length : 0);
    if (Array.isArray(adminSupport.body)) {
      adminSupport.body.forEach((q) => {
        console.log('id', q._id, 'subject', q.subject, 'userEmail', q.userId?.email, 'status', q.status);
      });
      const candidate = adminSupport.body.find((q) => q.subject === 'Need expert advisory' && q.userId?.email === email);
      console.log('candidate', candidate ? candidate._id : 'not found');
    }
  } catch (err) {
    console.error(err);
  }
};
main();
