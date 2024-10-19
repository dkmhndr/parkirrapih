import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { Event } from '../../../types/index';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');

  let query = supabase.from('events').select('*');

  if (eventId) {
    query = query.eq('id', eventId);
  }

  const { data: events, error } = await query as { data: Event[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (eventId && events && events.length > 0) {
    const { data: guests, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

    if (guestError) {
      return NextResponse.json({ error: guestError.message }, { status: 500 });
    }

    return NextResponse.json({ event: events[0], guests }, { status: 200 });
  }

  return NextResponse.json(events, { status: 200 });
}

export async function POST(req: NextRequest) {
  const {
    name,
    latitude,
    longitude,
    event_start,
    event_end,
    car_slot,
    motorcycle_slot,
  } = await req.json();

  const { data, error } = await supabase
    .from('events')
    .insert([
      { name, latitude, longitude, event_start, event_end, car_slot, motorcycle_slot },
    ]) as { data: Event[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, ...updateData } = await req.json();

  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id) as { data: Event[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  const { data, error } = await supabase
    .from('events')
    .delete()
    .eq('id', id) as { data: Event[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
}
