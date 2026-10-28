const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const fixAffiliateRoles = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const result = await User.updateMany(
      { role: 'AFFILIATE' },
      { $set: { role: 'STUDENT' } }
    );

    console.log(`✅ Successfully updated ${result.modifiedCount || result.nModified || 0} user records from 'AFFILIATE' to 'STUDENT'.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during role migration:', err);
    process.exit(1);
  }
};

fixAffiliateRoles();
