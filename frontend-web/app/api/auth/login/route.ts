// frontend-web/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Use the Render backend URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://your-backend-name.onrender.com/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, rememberMe } = body;

    console.log('🔐 Login attempt for:', phone);
    console.log('📡 Forwarding to:', `${BACKEND_API_URL}/auth/login`);

    // Forward the request to your Render backend
    const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        phone,
        password,
        rememberMe,
      }),
    });

    console.log('📡 Backend response status:', response.status);

    // Get the response data
    const data = await response.json();

    // Return the response to the frontend
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Login proxy error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Unable to connect to authentication service. Please check if the backend server is running.' 
      },
      { status: 503 }
    );
  }
}