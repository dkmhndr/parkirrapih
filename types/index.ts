import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Event {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  event_date: Date;
  event_start: Date;
  event_end: Date;
  car_slot: number;
  motorcycle_slot: number;
}

export interface Parking {
  id: number;
  guest_id: number;
  event_id: number;
  vehicle_type: 'car' | 'motorcycle';
  park_in: Date;
  park_out?: Date; // park_out bisa undefined jika belum parkir keluar
}

export interface Guest {
  id: number;
  name: string;
  unique_code: string;
  event_id: number;
  session_preference: Date;
  attendance: boolean;
  greeting: string;
}

export interface Transaction {
  id: number;
  parking_id: number;
  amount: number;
  payment_method: string;
}

export interface Parkingman {
  id: number;
  name: string;
}