import { NextResponse } from 'next/server';
import dvhcvnData from '@/data/dvhcvn.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceCode = searchParams.get('provinceCode');

    if (!provinceCode) {
      return NextResponse.json({ success: false, error: 'provinceCode is required' }, { status: 400 });
    }

    const province = dvhcvnData.data.find((p: any) => p.level1_id === provinceCode);
    if (!province) {
      return NextResponse.json({ success: true, data: [] });
    }

    const districts = province.level2s.map((d: any) => ({
      code: d.level2_id,
      name: d.name,
      name_with_type: d.name
    }));

    return NextResponse.json({
      success: true,
      data: districts
    });
  } catch (error) {
    console.error('Failed to load 3-level districts:', error);
    return NextResponse.json({ success: false, error: 'Failed to load districts' }, { status: 500 });
  }
}
