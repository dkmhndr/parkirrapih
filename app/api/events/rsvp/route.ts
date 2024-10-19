import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { Event, Guest } from '../../../../types/index';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  // Fetch event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single() as { data: Event | null; error: any };

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }


  // Calculate session options
  const moment = require('moment');
  const eventStart = moment(event.event_start, 'HH:mm:ss');
  const eventEnd = moment(event.event_end, 'HH:mm:ss');

  const sessionDuration = moment.duration(eventEnd.diff(eventStart)).asHours() / 3;
  const sessions = [];

  for (let i = 0; i < 3; i++) {
    const sessionStart = moment(eventStart).add(i * sessionDuration, 'hours');
    const sessionEnd = moment(sessionStart).add(sessionDuration, 'hours');
    sessions.push({
      id: i + 1,
      start: sessionStart.format('HH:mm'),
      end: sessionEnd.format('HH:mm')
    });
  }
  

  return NextResponse.json({ event, sessions }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const { guestId, eventId, sessionPreference } = await req.json();

  if (!guestId || !eventId || !sessionPreference) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Update guest's session preference
  const { data, error } = await supabase
    .from('guests')
    .update({ session_preference: sessionPreference })
    .eq('id', guestId)
    .eq('event_id', eventId) as { data: Guest[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'RSVP updated successfully' }, { status: 200 });
}
