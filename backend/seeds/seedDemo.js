const connectDatabase = require('../config/database');
const Course = require('../models/Course');
const Product = require('../models/Product');
const User = require('../models/User');

async function seed() {
  await connectDatabase();

  // create demo course
  const course = await Course.create({ title: 'Intro to Maize', description: 'Basics of maize cultivation', xpReward: 50, badgeOnComplete: 'First Harvest', lessons: [{ title: 'Soil prep', content: 'Prepare soil...' }, { title: 'Planting', content: 'Plant seeds...' }] });
  console.log('Created course', course._id);

  // create demo product
  const admin = await User.findOne({ role: 'admin' }) || await User.create({ name: 'Admin', email: 'admin@example.com', password: 'Admin@1234', role: 'admin' });
  const p = await Product.create({ name: 'Demo Fertilizer', description: 'Boost crop yields', price: 10, category: 'inputs', seller: admin._id });
  console.log('Created product', p._id);

  // create demo leaderboard users
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const u = await User.create({ name: `Farmer ${i}`, email: `farmer${Date.now()}${i}@example.com`, password: 'Pass1234!', role: 'farmer', xp: i * 120 });
    users.push(u);
    console.log('Created user', u.email);
  }

  console.log('Seeding complete');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
