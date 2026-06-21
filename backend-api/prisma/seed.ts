/// <reference types='node' />
/// <reference types='node' />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // ============================================
  // 1. CREATE USERS (Riders and Drivers)
  // ============================================
  console.log('📝 Creating users...');

  // Riders
  const rider1 = await prisma.user.create({
    data: {
      phone: '+250788123456',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'RIDER',
      isActive: true,
      isVerified: true,
      wallet: { create: { balance: 15000 } },
    },
  });

  const rider2 = await prisma.user.create({
    data: {
      phone: '+250788123457',
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'RIDER',
      isActive: true,
      isVerified: true,
      wallet: { create: { balance: 8000 } },
    },
  });

  const rider3 = await prisma.user.create({
    data: {
      phone: '+250788123458',
      name: 'Alice Uwase',
      email: 'alice@example.com',
      password: 'password123',
      role: 'RIDER',
      isActive: true,
      isVerified: true,
      wallet: { create: { balance: 5000 } },
    },
  });

  // Drivers
  const driver1 = await prisma.user.create({
    data: {
      phone: '+250788123401',
      name: 'John Mugabo',
      email: 'john.mugabo@motobus.rw',
      password: 'password123',
      role: 'DRIVER',
      isActive: true,
      isVerified: true,
      driver: {
        create: {
          licenseNumber: 'DL001234',
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
      wallet: { create: { balance: 0 } },
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      phone: '+250788123402',
      name: 'Peter Nshuti',
      email: 'peter@motobus.rw',
      password: 'password123',
      role: 'DRIVER',
      isActive: true,
      isVerified: true,
      driver: {
        create: {
          licenseNumber: 'DL002345',
          vehicleType: 'MOTO',
          vehicleNumber: 'MT-002B',
          vehicleModel: 'TVS Apache',
          isApproved: true,
          isOnline: true,
          rating: 4.9,
          currentLat: -1.9450,
          currentLng: 30.0625,
          totalTrips: 67,
          totalEarnings: 53600,
        },
      },
      wallet: { create: { balance: 0 } },
    },
  });

  const driver3 = await prisma.user.create({
    data: {
      phone: '+250788123403',
      name: 'Sarah Uwimana',
      email: 'sarah@motobus.rw',
      password: 'password123',
      role: 'DRIVER',
      isActive: true,
      isVerified: true,
      driver: {
        create: {
          licenseNumber: 'DL003456',
          vehicleType: 'BUS',
          vehicleNumber: 'BUS-101',
          vehicleModel: 'Toyota Coaster',
          isApproved: true,
          isOnline: true,
          rating: 4.7,
          currentLat: -1.9430,
          currentLng: 30.0600,
          totalTrips: 128,
          totalEarnings: 102400,
        },
      },
      wallet: { create: { balance: 0 } },
    },
  });

  const driver4 = await prisma.user.create({
    data: {
      phone: '+250788123404',
      name: 'James Rukundo',
      email: 'james@motobus.rw',
      password: 'password123',
      role: 'DRIVER',
      isActive: true,
      isVerified: true,
      driver: {
        create: {
          licenseNumber: 'DL004567',
          vehicleType: 'MINIBUS',
          vehicleNumber: 'MB-023',
          vehicleModel: 'Hiace',
          isApproved: true,
          isOnline: false,
          rating: 4.6,
          currentLat: -1.9420,
          currentLng: 30.0850,
          totalTrips: 34,
          totalEarnings: 27200,
        },
      },
      wallet: { create: { balance: 0 } },
    },
  });

  const driver5 = await prisma.user.create({
    data: {
      phone: '+250788123405',
      name: 'Alice Mukamana',
      email: 'alice.driver@motobus.rw',
      password: 'password123',
      role: 'DRIVER',
      isActive: true,
      isVerified: true,
      driver: {
        create: {
          licenseNumber: 'DL005678',
          vehicleType: 'MOTO',
          vehicleNumber: 'RD-045C',
          vehicleModel: 'Honda PCX',
          isApproved: true,
          isOnline: true,
          rating: 5.0,
          currentLat: -1.9650,
          currentLng: 30.1300,
          totalTrips: 89,
          totalEarnings: 71200,
        },
      },
      wallet: { create: { balance: 0 } },
    },
  });

  console.log(`✅ Created ${await prisma.user.count()} users`);

  // ============================================
  // 2. CREATE otp RECORDS (for testing)
  // ============================================
  console.log('\n🔑 Creating otp records for testing...');

  // Create otps for each user
  const otpData = [
    { phone: '+250788123456', otp: '123456' },
    { phone: '+250788123457', otp: '234567' },
    { phone: '+250788123458', otp: '345678' },
    { phone: '+250788123401', otp: '456789' },
    { phone: '+250788123402', otp: '567890' },
    { phone: '+250788123403', otp: '678901' },
  ];

  // FIX: Use 'otp' (lowercase) - the model name is 'otp' in schema
  for (const data of otpData) {
    await prisma.otp.create({
      data: {
        phone: data.phone,
        otp: data.otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        isUsed: false,
        attempts: 0,
      },
    });
  }

  console.log(`✅ Created ${otpData.length} otp records`);

  // ============================================
  // 3. CREATE COMPLETED RIDES
  // ============================================
  console.log('\n🚗 Creating ride history...');

  const ride1 = await prisma.ride.create({
    data: {
      riderId: rider1.id,
      driverId: (await prisma.driver.findUnique({ where: { userId: driver1.id } }))!.id,
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
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  const ride2 = await prisma.ride.create({
    data: {
      riderId: rider2.id,
      driverId: (await prisma.driver.findUnique({ where: { userId: driver2.id } }))!.id,
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
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  const ride3 = await prisma.ride.create({
    data: {
      riderId: rider3.id,
      driverId: (await prisma.driver.findUnique({ where: { userId: driver3.id } }))!.id,
      status: 'COMPLETED',
      pickupLat: -1.9430,
      pickupLng: 30.0600,
      pickupAddress: 'Downtown',
      dropoffLat: -1.9441,
      dropoffLng: 30.0619,
      dropoffAddress: 'Kigali City Tower',
      distance: 2.0,
      duration: 6,
      fare: 600,
      paymentMethod: 'CASH',
      paymentStatus: 'COMPLETED',
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  // Active ride (in progress)
  const ride4 = await prisma.ride.create({
    data: {
      riderId: rider1.id,
      driverId: (await prisma.driver.findUnique({ where: { userId: driver5.id } }))!.id,
      status: 'STARTED',
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
      paymentStatus: 'PENDING',
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    },
  });

  // Pending ride
  const ride5 = await prisma.ride.create({
    data: {
      riderId: rider2.id,
      status: 'PENDING',
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
      paymentStatus: 'PENDING',
    },
  });

  console.log(`✅ Created ${await prisma.ride.count()} rides`);

  // ============================================
  // 4. CREATE PAYMENTS
  // ============================================
  console.log('\n💰 Creating payments...');

  await prisma.payment.create({
    data: {
      rideId: ride1.id,
      userId: rider1.id,
      amount: 1200,
      method: 'WALLET',
      status: 'COMPLETED',
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      rideId: ride2.id,
      userId: rider2.id,
      amount: 1000,
      method: 'MOBILE_MONEY',
      status: 'COMPLETED',
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      rideId: ride3.id,
      userId: rider3.id,
      amount: 600,
      method: 'CASH',
      status: 'COMPLETED',
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Created ${await prisma.payment.count()} payments`);

  // ============================================
  // 5. CREATE RATINGS
  // ============================================
  console.log('\n⭐ Creating ratings...');

  await prisma.rating.create({
    data: {
      rideId: ride1.id,
      riderId: rider1.id,
      driverId: (await prisma.driver.findUnique({ where: { userId: driver1.id } }))!.id,
      rating: 5,
      comment: 'Excellent ride! Very professional driver. Clean bike and safe driving.',
    },
  });

  await prisma.rating.create({
    data: {
      rideId: ride2.id,
      riderId: rider2.id,
      driverId: (await prisma.driver.findUnique({ where: { userId: driver2.id } }))!.id,
      rating: 4,
      comment: 'Good ride, arrived on time. Would recommend.',
    },
  });

  await prisma.rating.create({
    data: {
      rideId: ride3.id,
      riderId: rider3.id,
      driverId: (await prisma.driver.findUnique({ where: { userId: driver3.id } }))!.id,
      rating: 5,
      comment: 'Great bus service! On time and comfortable.',
    },
  });

  console.log(`✅ Created ${await prisma.rating.count()} ratings`);

  // ============================================
  // 6. CREATE NOTIFICATIONS
  // ============================================
  console.log('\n🔔 Creating notifications...');

  await prisma.notification.createMany({
    data: [
      {
        userId: rider1.id,
        title: 'Welcome to Moto-Bus!',
        message: 'Thanks for joining. Your first ride is just a tap away.',
        type: 'SYSTEM',
        isRead: false,
      },
      {
        userId: rider1.id,
        title: 'Ride Completed',
        message: 'Your ride to Kimironko was completed successfully.',
        type: 'RIDE_COMPLETED',
        isRead: true,
      },
      {
        userId: driver1.id,
        title: 'New Ride Request',
        message: 'You have a new ride request nearby.',
        type: 'RIDE_REQUEST',
        isRead: false,
      },
      {
        userId: driver2.id,
        title: 'Payment Received',
        message: 'You received RWF 800 for your completed ride.',
        type: 'PAYMENT_RECEIVED',
        isRead: false,
      },
      {
        userId: driver5.id,
        title: 'Ride Started',
        message: 'You have started a ride with John Doe.',
        type: 'RIDE_STARTED',
        isRead: false,
      },
    ],
  });

  console.log(`✅ Created ${await prisma.notification.count()} notifications`);

  // ============================================
  // 7. CREATE SOS ALERTS
  // ============================================
  console.log('\n🚨 Creating SOS alerts...');

  // FIX: Use 'sOSAlert' or 'sosAlert' depending on your schema
  await prisma.sOSAlert.create({
    data: {
      userId: rider1.id,
      rideId: ride4.id,
      lat: -1.9441,
      lng: 30.0619,
      status: 'ACTIVE',
    },
  });

  await prisma.sOSAlert.create({
    data: {
      userId: rider3.id,
      rideId: ride3.id,
      lat: -1.9430,
      lng: 30.0600,
      status: 'RESOLVED',
    },
  });

  console.log(`✅ Created ${await prisma.sOSAlert.count()} SOS alerts`);

  // ============================================
  // 8. UPDATE WALLET BALANCES AFTER RIDES
  // ============================================
  console.log('\n💳 Updating wallet balances...');

  await prisma.wallet.update({
    where: { userId: rider1.id },
    data: { balance: { decrement: 1200 } },
  });

  await prisma.wallet.update({
    where: { userId: rider2.id },
    data: { balance: { decrement: 1000 } },
  });

  await prisma.wallet.update({
    where: { userId: rider3.id },
    data: { balance: { decrement: 600 } },
  });

  console.log('✅ Wallet balances updated');

  // ============================================
  // 9. UPDATE DRIVER EARNINGS
  // ============================================
  console.log('\n📈 Updating driver earnings...');

  const driver1Record = await prisma.driver.findUnique({ where: { userId: driver1.id } });
  const driver2Record = await prisma.driver.findUnique({ where: { userId: driver2.id } });
  const driver3Record = await prisma.driver.findUnique({ where: { userId: driver3.id } });
  const driver5Record = await prisma.driver.findUnique({ where: { userId: driver5.id } });

  if (driver1Record) {
    await prisma.driver.update({
      where: { id: driver1Record.id },
      data: {
        totalTrips: { increment: 1 },
        totalEarnings: { increment: 960 }, // 80% of 1200
      },
    });
  }

  if (driver2Record) {
    await prisma.driver.update({
      where: { id: driver2Record.id },
      data: {
        totalTrips: { increment: 1 },
        totalEarnings: { increment: 800 }, // 80% of 1000
      },
    });
  }

  if (driver3Record) {
    await prisma.driver.update({
      where: { id: driver3Record.id },
      data: {
        totalTrips: { increment: 1 },
        totalEarnings: { increment: 480 }, // 80% of 600
      },
    });
  }

  if (driver5Record) {
    await prisma.driver.update({
      where: { id: driver5Record.id },
      data: {
        totalTrips: { increment: 1 },
        totalEarnings: { increment: 960 }, // 80% of 1200
      },
    });
  }

  console.log('✅ Driver earnings updated');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(50));
  console.log(`\n📊 DATABASE SUMMARY:`);
  console.log(`   👥 Users: ${await prisma.user.count()}`);
  console.log(`   🚗 Drivers: ${await prisma.driver.count()}`);
  console.log(`   🚕 Rides: ${await prisma.ride.count()}`);
  console.log(`   💳 Payments: ${await prisma.payment.count()}`);
  console.log(`   ⭐ Ratings: ${await prisma.rating.count()}`);
  console.log(`   🔔 Notifications: ${await prisma.notification.count()}`);
  console.log(`   👛 Wallets: ${await prisma.wallet.count()}`);
  // FIX: Use 'otp' (lowercase)
  console.log(`   🔑 otps: ${await prisma.otp.count()}`);
  console.log(`   🚨 SOS Alerts: ${await prisma.sOSAlert.count()}`);

  // Driver details
  console.log(`\n👨‍✈️ DRIVERS CREATED:`);
  const allDrivers = await prisma.driver.findMany({
    include: { user: true },
  });
  allDrivers.forEach((driver, i) => {
    console.log(`   ${i + 1}. ${driver.user.name} - ${driver.vehicleType} (${driver.vehicleNumber}) - Rating: ${driver.rating}⭐ - ${driver.isOnline ? '🟢 Online' : '🔴 Offline'}`);
  });

  // Rider details
  console.log(`\n👤 RIDERS CREATED:`);
  const allRiders = await prisma.user.findMany({
    where: { role: 'RIDER' },
    include: { wallet: true },
  });
  allRiders.forEach((rider, i) => {
    console.log(`   ${i + 1}. ${rider.name} - Balance: ${rider.wallet?.balance} RWF`);
  });

  // Active rides
  console.log(`\n🚕 ACTIVE RIDES:`);
  const activeRides = await prisma.ride.findMany({
    where: {
      status: { in: ['PENDING', 'ACCEPTED', 'STARTED'] },
    },
    include: {
      rider: true,
      driver: { include: { user: true } },
    },
  });
  activeRides.forEach((ride, i) => {
    console.log(`   ${i + 1}. ${ride.rider.name} → ${ride.dropoffAddress} [${ride.status}]`);
  });

  console.log('\n🔑 TEST otps:');
  // FIX: Use 'otp' (lowercase) and add proper typing
  const otps = await prisma.otp.findMany({
    where: { isUsed: false },
    take: 5,
  });
  otps.forEach((otp: any, i: number) => {
    console.log(`   ${i + 1}. ${otp.phone} → ${otp.otp} (expires: ${otp.expiresAt.toLocaleTimeString()})`);
  });

  console.log('\n' + '='.repeat(50));
  console.log('🚀 You can now test the application with these test accounts!');
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });