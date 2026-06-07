import { NextResponse } from 'next/server';
import dvhcvnData from '@/data/dvhcvn.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceCode = searchParams.get('provinceCode');
    const districtCode = searchParams.get('districtCode');

    if (!provinceCode || !districtCode) {
      return NextResponse.json({ success: false, error: 'provinceCode and districtCode are required' }, { status: 400 });
    }

    const province = dvhcvnData.data.find((p: any) => p.level1_id === provinceCode);
    if (!province) {
      return NextResponse.json({ success: true, data: [] });
    }

    const district = province.level2s.find((d: any) => d.level2_id === districtCode);
    if (!district) {
      return NextResponse.json({ success: true, data: [] });
    }

    const wards = district.level3s.map((w: any) => ({
      code: w.level3_id,
      name: w.name,
      name_with_type: w.name
    }));

    return NextResponse.json({
      success: true,
      data: wards
    });
  } catch (error) {
    console.error('Failed to load 3-level wards:', error);
    return NextResponse.json({ success: false, error: 'Failed to load wards' }, { status: 500 });
  }
}
