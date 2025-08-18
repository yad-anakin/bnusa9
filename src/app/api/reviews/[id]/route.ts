import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
    const apiUrl = `${API_BASE_URL}/api/reviews/${params.id}`;

    console.log(`Proxying review request to: ${apiUrl}`);
    
    // Forward the request to the backend API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure we don't cache the response
    });
    
    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    // Get the response data
    const data = await response.json();

    // Return the response from the backend
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying review detail request:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch review details' },
      { status: 500 }
    );
  }
} 