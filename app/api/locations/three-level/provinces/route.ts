import { NextResponse } from 'next/server';
import dvhcvnData from '@/data/dvhcvn.json';

export async function GET() {
  try {
    const provinces = dvhcvnData.data.map((p: any) => ({
      code: p.level1_id,
      name: p.name,
      name_with_type: p.name
    }));
    
    return NextResponse.json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('Failed to load 3-level provinces:', error);
    return NextResponse.json({ success: false, error: 'Failed to load provinces' }, { status: 500 });
  }
}
