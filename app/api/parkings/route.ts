import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { Parking } from '../../../types/index';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qrCode = searchParams.get('qrCode');

  let query = supabase.from('parkings').select('*');

  if (qrCode) {
    query = query.eq('unique_code', qrCode);
  }

  const { data: parkings, error } = await query as { data: Parking[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(parkings, { status: 200 });
}

export async function POST(req: NextRequest) {
  const { event_id, vehicle_type, unique_code, park_in } = await req.json();

  const parkingman_id = '2'; // Hardcoded for now

  const { data, error } = await supabase
    .from('parkings')
    .insert([{ event_id, vehicle_type, unique_code, park_in, parkingman_id }]) as { data: Parking[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { unique_code, ...updateData } = await req.json();

  const { data, error } = await supabase
    .from('parkings')
    .update(updateData)
    .eq('unique_code', unique_code) as { data: Parking[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  const { data, error } = await supabase
    .from('parkings')
    .delete()
    .eq('id', id) as { data: Parking[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Parking record deleted successfully' }, { status: 200 });
}
