import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { Parking } from '../../../types/index';

export async function GET(req: NextRequest) {
  const { data: parkings, error } = await supabase
    .from('parkings')
    .select('*') as { data: Parking[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(parkings, { status: 200 });
}

export async function POST(req: NextRequest) {
  const { event_id, guest_id, vehicle_type, plate_number, park_in } = await req.json();

  const { data, error } = await supabase
    .from('parkings')
    .insert([{ event_id, guest_id, vehicle_type, plate_number, park_in }]) as { data: Parking[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, ...updateData } = await req.json();

  const { data, error } = await supabase
    .from('parkings')
    .update(updateData)
    .eq('id', id) as { data: Parking[] | null; error: any };

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
