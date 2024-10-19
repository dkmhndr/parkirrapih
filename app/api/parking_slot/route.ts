import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { Event, Parking } from '../../../types/index';

export async function GET(req: NextRequest, { params }: { params: { id: string[] } }) {
  const eventId = req.nextUrl.searchParams.get('eventId');

  // Fetch event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single() as { data: Event | null; error: any };

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Fetch current parkings for this event
  const { data: parkings, error: parkingError } = await supabase
    .from('parkings')
    .select('*')
    .eq('event_id', eventId)
    .is('park_out', null) as { data: Parking[] | null; error: any };

  if (parkingError) {
    return NextResponse.json({ error: parkingError.message }, { status: 500 });
  }

  // Calculate remaining slots
  const occupiedCarSlots = parkings?.filter(p => p.vehicle_type === 'car').length || 0;
  const occupiedMotorcycleSlots = parkings?.filter(p => p.vehicle_type === 'motorcycle').length || 0;

  const remainingCarSlots = event.car_slot - occupiedCarSlots;
  const remainingMotorcycleSlots = event.motorcycle_slot - occupiedMotorcycleSlots;

  return NextResponse.json({
    eventId: event.id,
    eventName: event.name,
    occupiedCarSlots,
    occupiedMotorcycleSlots,
    remainingCarSlots,
    remainingMotorcycleSlots
  }, { status: 200 });
}
