import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { Guest } from '../../../types/index';

export async function GET(req: NextRequest) {
  const { data: guests, error } = await supabase
    .from('guests')
    .select('*') as { data: Guest[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(guests, { status: 200 });
}

export async function POST(req: NextRequest) {
  const { name, session_preference, greeting, attendance, event_id } = await req.json();

  // Generate a unique code
  const unique_code = Math.random().toString(36).substring(2, 7).toUpperCase();

  const insertData = { name, unique_code, session_preference, greeting, attendance, event_id };

  const { data, error } = await supabase
    .from('guests')
    .insert([{ name, unique_code, session_preference, greeting, attendance, event_id }]) as { data: Guest[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(insertData, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, ...updateData } = await req.json();

  const { data, error } = await supabase
    .from('guests')
    .update(updateData)
    .eq('id', id) as { data: Guest[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  const { data, error } = await supabase
    .from('guests')
    .delete()
    .eq('id', id) as { data: Guest[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Guest deleted successfully' }, { status: 200 });
}
