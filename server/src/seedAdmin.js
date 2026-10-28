const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedOnlyAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    // Remove any demo accounts that were created
    await User.deleteMany({
      email: { $in: ['teacher@gmail.com', 'student@gmail.com', 'complaintwork2@gmail.com'] }
    });

    const adminEmail = 'admin@gmail.com';
    const adminPassword = '12345678';
    const adminMobile = '9876543210';

    let admin = await User.findOne({
      $or: [{ email: adminEmail }, { mobile: adminMobile }]
    });

    if (admin) {
      admin.name = 'Super Admin';
      admin.email = adminEmail;
      admin.mobile = adminMobile;
      admin.password = adminPassword; // Pre-save hook will hash it with bcrypt
      admin.role = 'ADMIN';
      admin.isMobileVerified = true;
      admin.isEmailVerified = true;
      admin.kycStatus = 'VERIFIED';
      admin.status = 'ACTIVE';
      admin.isBlocked = false;
      await admin.save();
      console.log(`✅ Admin account updated: ${admin.email} (Password: ${adminPassword})`);
    } else {
      admin = new User({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        mobile: adminMobile,
        role: 'ADMIN',
        isMobileVerified: true,
        isEmailVerified: true,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
        isBlocked: false,
        stateCode: 'KA'
      });
      await admin.save();
      console.log(`✅ Admin account created: ${admin.email} (Password: ${adminPassword})`);
    }

    await mongoose.disconnect();
    console.log('🎉 Done! ONLY admin@gmail.com / 12345678 is set.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Admin account:', err);
    process.exit(1);
  }
};

seedOnlyAdmin();
