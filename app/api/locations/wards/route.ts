import { NextResponse } from 'next/server';
import wardData from '@/data/ward.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceCode = searchParams.get('provinceCode');

    if (!provinceCode) {
      return NextResponse.json({ success: false, error: 'provinceCode is required' }, { status: 400 });
    }

    const wards = Object.values(wardData).filter(
      (ward: any) => ward.parent_code === provinceCode
    );
    
    return NextResponse.json({
      success: true,
      data: wards
    });
  } catch (error) {
    console.error('Failed to load wards:', error);
    return NextResponse.json({ success: false, error: 'Failed to load wards' }, { status: 500 });
  }
}
