import { NextResponse } from 'next/server';

// In production, this would fetch from your backend
// For now, return static or cached data
export async function GET() {
  // You can fetch from your actual backend
  // const res = await fetch('http://localhost:5000/api/landing/stats');
  // const data = await res.json();
  
  // Or return mock data for development
  const stats = {
    dailyRides: 24800,
    activeDrivers: 680,
    avgRating: 4.9,
    onlineNow: 247,
    countries: 5,
    cities: 12,
  };
  
  return NextResponse.json(stats);
}