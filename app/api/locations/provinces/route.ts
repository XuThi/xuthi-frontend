import { NextResponse } from 'next/server';
import provinceData from '@/data/province.json';

export async function GET() {
  try {
    const provinces = Object.values(provinceData);
    
    return NextResponse.json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('Failed to load provinces:', error);
    return NextResponse.json({ success: false, error: 'Failed to load provinces' }, { status: 500 });
  }
}
