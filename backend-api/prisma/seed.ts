// prisma/seed.ts
/// <reference types='node' />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Password hashing helper
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // ============================================
  // 1. CREATE ADMIN USER
  // ============================================
  console.log('👑 Creating admin user...');

  const adminPassword = await hashPassword('Admin@2026');
  
  const admin = await prisma.user.upsert({
    where: { phone: '+250788888888' },
    update: {
      name: 'System Administrator',
      email: 'admin@motobus.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
    },
    create: {
      phone: '+250788888888',
      name: 'System Administrator',
      email: 'admin@motobus.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      wallet: { 
        create: { 
          balance: 100000 
        } 
      },
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);

  // ============================================
  // 2. CREATE DRIVER USER
  // ============================================
  console.log('🚗 Creating test driver...');

  const driverPassword = await hashPassword('Driver@2026');
  
  const testDriver = await prisma.user.upsert({
    where: { phone: '+250788888889' },
    update: {
      name: 'Jean Pierre Niyonzima',
      email: 'driver@motobus.com',
      password: driverPassword,
      role: 'DRIVER',
      isActive: true,
      isVerified: true,
    },
    create: {
      phone: '+250788888889',
      name: 'Jean Pierre Niyonzima',
      email: 'driver@motobus.com',
      password: driverPassword,
      role: 'DRIVER',
      isActive: true,
      isVerified: true,
      driver: {
        create: {
          licenseNumber: 'DL-2024-001234',
          vehicleType: 'MOTO',
          vehicleNumber: 'MT-001A',
          vehicleModel: 'Yamaha FZ-S',
          isApproved: true,
          isOnline: true,
          rating: 4.8,
          currentLat: -1.9441,
          currentLng: 30.0619,
          totalTrips: 45,
          totalEarnings: 36000,
        },
      },
      wallet: { 
        create: { 
          balance: 50000 
        } 
      },
    },
  });

  console.log(`✅ Test Driver created: ${testDriver.email}`);

  // ============================================
  // 3. CREATE PASSENGER USER
  // ============================================
  console.log('👤 Creating test passenger...');

  const passengerPassword = await hashPassword('Passenger@2026');
  
  const testPassenger = await prisma.user.upsert({
    where: { phone: '+250788888890' },
    update: {
      name: 'Marie Claire Umutoni',
      email: 'passenger@motobus.com',
      password: passengerPassword,
      role: 'RIDER',
      isActive: true,
      isVerified: true,
    },
    create: {
      phone: '+250788888890',
      name: 'Marie Claire Umutoni',
      email: 'passenger@motobus.com',
      password: passengerPassword,
      role: 'RIDER',
      isActive: true,
      isVerified: true,
      wallet: { 
        create: { 
          balance: 25000 
        } 
      },
    },
  });

  console.log(`✅ Test Passenger created: ${testPassenger.email}`);

  // ============================================
  // 4. CREATE RIDERS
  // ============================================
  console.log('📝 Creating riders...');

  const ridersData = [
    {
      phone: '+250788123456',
      name: 'John Doe',
      email: 'john@example.com',
      password: await hashPassword('password123'),
      balance: 15000,
    },
    {
      phone: '+250788123457',
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: await hashPassword('password123'),
      balance: 8000,
    },
    {
      phone: '+250788123458',
      name: 'Alice Uwase',
      email: 'alice@example.com',
      password: await hashPassword('password123'),
      balance: 5000,
    },
  ];

  for (const riderData of ridersData) {
    await prisma.user.upsert({
      where: { phone: riderData.phone },
      update: {
        name: riderData.name,
        email: riderData.email,
        password: riderData.password,
        role: 'RIDER',
        isActive: true,
        isVerified: true,
      },
      create: {
        phone: riderData.phone,
        name: riderData.name,
        email: riderData.email,
        password: riderData.password,
        role: 'RIDER',
        isActive: true,
        isVerified: true,
        wallet: { 
          create: { 
            balance: riderData.balance 
          } 
        },
      },
    });
  }

  console.log(`✅ Created ${ridersData.length} riders`);

  // ============================================
  // 5. CREATE DRIVERS
  // ============================================
  console.log('🚗 Creating drivers...');

  const driversData = [
    {
      phone: '+250788123401',
      name: 'John Mugabo',
      email: 'john.mugabo@motobus.rw',
      password: await hashPassword('password123'),
      licenseNumber: 'DL001234',
      vehicleType: 'MOTO' as const,
      vehicleNumber: 'MT-001A',
      vehicleModel: 'Yamaha FZ-S',
      rating: 4.8,
      balance: 0,
    },
    {
      phone: '+250788123402',
      name: 'Peter Nshuti',
      email: 'peter@motobus.rw',
      password: await hashPassword('password123'),
      licenseNumber: 'DL002345',
      vehicleType: 'MOTO' as const,
      vehicleNumber: 'MT-002B',
      vehicleModel: 'TVS Apache',
      rating: 4.9,
      balance: 0,
    },
    {
      phone: '+250788123403',
      name: 'Sarah Uwimana',
      email: 'sarah@motobus.rw',
      password: await hashPassword('password123'),
      licenseNumber: 'DL003456',
      vehicleType: 'BUS' as const,
      vehicleNumber: 'BUS-101',
      vehicleModel: 'Toyota Coaster',
      rating: 4.7,
      balance: 0,
    },
    {
      phone: '+250788123404',
      name: 'James Rukundo',
      email: 'james@motobus.rw',
      password: await hashPassword('password123'),
      licenseNumber: 'DL004567',
      vehicleType: 'MINIBUS' as const,
      vehicleNumber: 'MB-023',
      vehicleModel: 'Hiace',
      rating: 4.6,
      balance: 0,
    },
    {
      phone: '+250788123405',
      name: 'Alice Mukamana',
      email: 'alice.driver@motobus.rw',
      password: await hashPassword('password123'),
      licenseNumber: 'DL005678',
      vehicleType: 'MOTO' as const,
      vehicleNumber: 'RD-045C',
      vehicleModel: 'Honda PCX',
      rating: 5.0,
      balance: 0,
    },
  ];

  for (const driverData of driversData) {
    await prisma.user.upsert({
      where: { phone: driverData.phone },
      update: {
        name: driverData.name,
        email: driverData.email,
        password: driverData.password,
        role: 'DRIVER',
        isActive: true,
        isVerified: true,
      },
      create: {
        phone: driverData.phone,
        name: driverData.name,
        email: driverData.email,
        password: driverData.password,
        role: 'DRIVER',
        isActive: true,
        isVerified: true,
        driver: {
          create: {
            licenseNumber: driverData.licenseNumber,
            vehicleType: driverData.vehicleType,
            vehicleNumber: driverData.vehicleNumber,
            vehicleModel: driverData.vehicleModel,
            isApproved: true,
            isOnline: true,
            rating: driverData.rating,
            currentLat: -1.9441 + (Math.random() - 0.5) * 0.02,
            currentLng: 30.0619 + (Math.random() - 0.5) * 0.02,
            totalTrips: Math.floor(Math.random() * 100),
            totalEarnings: Math.floor(Math.random() * 50000),
          },
        },
        wallet: { 
          create: { 
            balance: driverData.balance 
          } 
        },
      },
    });
  }

  console.log(`✅ Created ${driversData.length} drivers`);

  // ============================================
  // 6. CREATE OTP RECORDS
  // ============================================
  console.log('\n🔑 Creating OTP records for testing...');

  const otpData = [
    { phone: '+250788123456', otp: '123456' },
    { phone: '+250788123457', otp: '234567' },
    { phone: '+250788123458', otp: '345678' },
    { phone: '+250788123401', otp: '456789' },
    { phone: '+250788123402', otp: '567890' },
    { phone: '+250788123403', otp: '678901' },
    { phone: '+250788888888', otp: '111111' },
    { phone: '+250788888889', otp: '222222' },
    { phone: '+250788888890', otp: '333333' },
  ];

  for (const data of otpData) {
    // Check if OTP exists
    const existingOtp = await prisma.otp.findFirst({
      where: { phone: data.phone }
    });

    if (existingOtp) {
      // Update existing OTP
      await prisma.otp.update({
        where: { id: existingOtp.id },
        data: {
          otp: data.otp,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          isUsed: false,
          attempts: 0,
        },
      });
    } else {
      // Create new OTP
      await prisma.otp.create({
        data: {
          phone: data.phone,
          otp: data.otp,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          isUsed: false,
          attempts: 0,
        },
      });
    }
  }

  console.log(`✅ Created/Updated ${otpData.length} OTP records`);

  // ============================================
  // 7. CREATE RIDE HISTORY
  // ============================================
  console.log('\n🚗 Creating ride history...');

  // Get users for rides
  const rider1 = await prisma.user.findUnique({ where: { phone: '+250788123456' } });
  const rider2 = await prisma.user.findUnique({ where: { phone: '+250788123457' } });
  const driver1 = await prisma.driver.findFirst({ where: { licenseNumber: 'DL001234' } });
  const driver2 = await prisma.driver.findFirst({ where: { licenseNumber: 'DL002345' } });

  if (rider1 && driver1) {
    await prisma.ride.create({
      data: {
        riderId: rider1.id,
        driverId: driver1.id,
        status: 'COMPLETED',
        pickupLat: -1.9441,
        pickupLng: 30.0619,
        pickupAddress: 'Kigali City Tower',
        dropoffLat: -1.9441,
        dropoffLng: 30.0719,
        dropoffAddress: 'Kimironko Market',
        distance: 3.5,
        duration: 12,
        fare: 1200,
        paymentMethod: 'WALLET',
        paymentStatus: 'COMPLETED',
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  if (rider2 && driver2) {
    await prisma.ride.create({
      data: {
        riderId: rider2.id,
        driverId: driver2.id,
        status: 'COMPLETED',
        pickupLat: -1.9455,
        pickupLng: 30.0719,
        pickupAddress: 'Kimironko Market',
        dropoffLat: -1.9441,
        dropoffLng: 30.0619,
        dropoffAddress: 'Kigali City Tower',
        distance: 3.2,
        duration: 10,
        fare: 1000,
        paymentMethod: 'MOBILE_MONEY',
        paymentStatus: 'COMPLETED',
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`✅ Created rides`);

  // ============================================
  // 8. SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  
  console.log('\n📊 DATABASE SUMMARY:');
  console.log(`   👥 Total Users: ${await prisma.user.count()}`);
  console.log(`   👑 Admins: ${await prisma.user.count({ where: { role: 'ADMIN' } })}`);
  console.log(`   🚗 Drivers: ${await prisma.user.count({ where: { role: 'DRIVER' } })}`);
  console.log(`   👤 Riders: ${await prisma.user.count({ where: { role: 'RIDER' } })}`);
  console.log(`   👛 Wallets: ${await prisma.wallet.count()}`);
  console.log(`   🔑 OTPs: ${await prisma.otp.count()}`);
  console.log(`   🚗 Rides: ${await prisma.ride.count()}`);

  // Test Users Summary
  console.log('\n🧪 TEST USERS:');
  console.log('   ┌─────────────────────────────────────────────────────────────────┐');
  console.log('   │ Email                  │ Password      │ Role     │ Balance   │');
  console.log('   ├─────────────────────────────────────────────────────────────────┤');
  
  const testUsers = await prisma.user.findMany({
    where: {
      phone: {
        in: ['+250788888888', '+250788888889', '+250788888890']
      }
    },
    include: { wallet: true }
  });

  for (const user of testUsers) {
    const password = user.phone === '+250788888888' ? 'Admin@2026' :
                     user.phone === '+250788888889' ? 'Driver@2026' :
                     'Passenger@2026';
    const emailDisplay = user.email || user.phone;
    console.log(`   │ ${emailDisplay.padEnd(20)} │ ${password.padEnd(12)} │ ${user.role.padEnd(7)} │ ${String(user.wallet?.balance || 0).padStart(8)} │`);
  }
  console.log('   └─────────────────────────────────────────────────────────────────┘');

  console.log('\n🔑 TEST OTPs:');
  const testOtps = await prisma.otp.findMany({
    where: {
      phone: {
        in: ['+250788888888', '+250788888889', '+250788888890']
      },
      isUsed: false,
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  for (const otp of testOtps) {
    console.log(`   📱 ${otp.phone} → OTP: ${otp.otp}`);
  }

  console.log('\n🚀 You can now test the application with these accounts!');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });