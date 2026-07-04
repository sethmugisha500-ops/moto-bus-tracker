// backend-api/src/scripts/quick-approve.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickApprove() {
  try {
    console.log('🔍 Finding driver with phone: +250788888889');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { phone: '+250788888889' },
      include: { driver: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    if (!user.driver) {
      console.log('❌ Driver not found for this user');
      return;
    }

    console.log(`📋 Found driver: ${user.name}`);
    console.log(`   Current status: ${user.driver.isApproved ? '✅ Approved' : '⏳ Pending'}`);

    // Approve the driver
    const driver = await prisma.driver.update({
      where: { id: user.driver.id },
      data: { isApproved: true },
      include: { user: { select: { name: true, phone: true } } }
    });

    console.log('\n✅ Driver approved successfully!');
    console.log(`   Name: ${driver.user.name}`);
    console.log(`   Phone: ${driver.user.phone}`);
    console.log(`   Status: ${driver.isApproved ? '✅ Approved' : '⏳ Pending'}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickApprove();