import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { Parkingman } from '../../../types/index';

export async function GET(req: NextRequest) {
  const { data: parkingmans, error } = await supabase
    .from('parkingmans')
    .select('*') as { data: Parkingman[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(parkingmans, { status: 200 });
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();

  const { data, error } = await supabase
    .from('parkingmans')
    .insert([{ name }]) as { data: Parkingman[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, name } = await req.json();

  const { data, error } = await supabase
    .from('parkingmans')
    .update({ name })
    .eq('id', id) as { data: Parkingman[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  const { data, error } = await supabase
    .from('parkingmans')
    .delete()
    .eq('id', id) as { data: Parkingman[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Parkingman deleted successfully' }, { status: 200 });
}
