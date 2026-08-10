const base = 'http://127.0.0.1:5000/api';

const requestJson = async (path, options = {}) => {
  const res = await fetch(`${base}${path}`, options);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (_err) { json = text; }
  return { status: res.status, body: json };
};

const main = async () => {
  try {
    const email = `testfarmer${Date.now()}@example.com`;
    const farmerRegister = await requestJson('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Farmer',
        email,
        password: 'Farmer@1234',
        phone: '0000000000',
        location: 'Testville',
        farmName: 'Test Farm'
      })
    });
    console.log('farmer register', farmerRegister.status, farmerRegister.body);
    if (farmerRegister.status !== 201) return;

    const farmerLogin = await requestJson('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Farmer@1234' })
    });
    console.log('farmer login', farmerLogin.status, farmerLogin.body);
    if (farmerLogin.status !== 200 || !farmerLogin.body.token) return;

    const farmerToken = farmerLogin.body.token;
    const farmerHeaders = {
      Authorization: `Bearer ${farmerToken}`,
      'Content-Type': 'application/json'
    };

    const supportSubmit = await requestJson('/farmer/support', {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({ category: 'crop', subject: 'Need expert advisory', details: 'Please advise on maize fertilizer.' })
    });
    console.log('support submit', supportSubmit.status, supportSubmit.body);
    const supportQueryId = supportSubmit.body?._id;
    console.log('support query id', supportQueryId);

    const farmerQueries = await requestJson('/farmer/support/queries', { headers: farmerHeaders });
    console.log('farmer queries', farmerQueries.status, farmerQueries.body);

    const farmerNotifications = await requestJson('/farmer/notifications', { headers: farmerHeaders });
    console.log('farmer notifications initial', farmerNotifications.status, farmerNotifications.body);

    const adminLogin = await requestJson('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Admin@1234' })
    });
    console.log('admin login', adminLogin.status, adminLogin.body);
    if (adminLogin.status !== 200 || !adminLogin.body.token) return;

    const adminHeaders = {
      Authorization: `Bearer ${adminLogin.body.token}`,
      'Content-Type': 'application/json'
    };

    const adminNotifications = await requestJson('/admin/notifications', { headers: adminHeaders });
    console.log('admin notifications', adminNotifications.status, adminNotifications.body);

    const adminSupport = await requestJson('/admin/support', { headers: adminHeaders });
    console.log('admin support', adminSupport.status, adminSupport.body);

    if (Array.isArray(adminSupport.body) && adminSupport.body.length > 0) {
      const queryId = adminSupport.body[0]._id;
      const review = await requestJson(`/admin/support/${queryId}/review`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ response: 'Use nitrogen-rich fertilizer and monitor soil moisture.', status: 'reviewed' })
      });
      console.log('admin review', review.status, review.body);

      const farmerNotificationsAfterReview = await requestJson('/farmer/notifications', { headers: farmerHeaders });
      console.log('farmer notifications after review', farmerNotificationsAfterReview.status, farmerNotificationsAfterReview.body);

      const markRead = await requestJson('/farmer/notifications/read', { method: 'POST', headers: farmerHeaders });
      console.log('farmer mark read', markRead.status, markRead.body);

      const farmerNotificationsRead = await requestJson('/farmer/notifications', { headers: farmerHeaders });
      console.log('farmer notifications after read', farmerNotificationsRead.status, farmerNotificationsRead.body);
    }
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  }
};

main();
