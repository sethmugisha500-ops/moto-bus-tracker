// backend-api/scripts/check-drivers.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const drivers = await prisma.driver.findMany({
    select: {
      id: true,
      isOnline: true,
      isApproved: true,
      vehicleType: true,
      currentLat: true,
      currentLng: true,
      user: { select: { name: true, phone: true } },
    },
  });

  console.log(`\n📊 Total drivers: ${drivers.length}\n`);
  drivers.forEach(d => {
    console.log(
      `${d.user.name.padEnd(20)} | online: ${String(d.isOnline).padEnd(5)} | approved: ${String(d.isApproved).padEnd(5)} | vehicleType: ${d.vehicleType} | lat/lng: ${d.currentLat}, ${d.currentLng}`
    );
  });

  const eligible = drivers.filter(d => d.isOnline && d.isApproved);
  console.log(`\n✅ Eligible for matching (online + approved): ${eligible.length}`);

  if (eligible.length === 0 && drivers.length > 0) {
    console.log('\n⚠️  No eligible drivers — check isOnline/isApproved flags above.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());