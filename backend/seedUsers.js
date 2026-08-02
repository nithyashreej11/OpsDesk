require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const usersToCreate = [
  { name: 'Test Reporter', email: 'reporter@example.com', password: 'pass123', role: 'Reporter' },
  { name: 'Test Engineer', email: 'engineer@example.com', password: 'pass123', role: 'Engineer' },
  { name: 'Test Manager', email: 'manager@example.com', password: 'pass123', role: 'Manager' },
  { name: 'Test Admin', email: 'admin@example.com', password: 'pass123', role: 'Admin' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  for (const u of usersToCreate) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log('Already exists, skipping:', u.email);
      continue;
    }
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const created = await User.create({ ...u, password: hashedPassword });
    console.log('Created:', created.email, created.role);
  }

  const all = await User.find({}, 'name email role');
  console.log('--- ALL USERS NOW ---');
  all.forEach((user) => console.log(user.email, '-', user.role));

  process.exit();
}

seed();