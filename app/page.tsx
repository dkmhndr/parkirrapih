"use client"

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from "@nextui-org/button";
import { Input, Textarea } from "@nextui-org/input";
import { card, Radio, RadioGroup, Select, SelectItem } from '@nextui-org/react';
import moment from 'moment';
import { FaCheckCircle } from 'react-icons/fa';

enum ScreenState {
  INITIAL,
  RSVP,
  COUNTDOWN,
  PARKING_CHECK,
  QR_CODE
}

export default function Home() {
  const [screenState, setScreenState] = useState(ScreenState.RSVP);
  const [availableTimes, setAvailableTimes] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<any>(null);
  const [uniqueId, setUniqueId] = useState<string>('123');
  const [formData, setFormData] = useState({
    name: '',
    greeting: '',
    attendance: false,
    session_preference: ''
  });
  const [eventDate, setEventDate] = useState<string>('');
  const [guests, setGuests] = useState<any>([]);
  const [timeLeft, setTimeLeft] = useState({
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (eventDate) {
      const interval = setInterval(() => {
        const now = moment();
        const eventMoment = moment(eventDate, 'YYYY-MM-DD HH:mm:ss');
        const duration = moment.duration(eventMoment.diff(now));

        const weeks = Math.floor(duration.asWeeks()) || 0;
        const days = duration.days() || 0;
        const hours = duration.hours() || 0;
        const minutes = duration.minutes() || 0;
        const seconds = duration.seconds() || 0;

        setTimeLeft({ weeks, days, hours, minutes, seconds });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [eventDate]);

  moment.locale('id');

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      try {
        const response = await fetch('/api/events/rsvp?eventId=1');
        if (!response.ok) {
          throw new Error('Failed to fetch available times');
        }
        const data = await response.json();
        setAvailableTimes(data.sessions);
      } catch (error) {
        console.error('Error fetching available times:', error);
      }
    };
    if (availableTimes === null) {
      fetchAvailableTimes();
    }
  }, [availableTimes]);

  const fetchEventDate = async () => {
    try {
      const response = await fetch('/api/events?eventId=1'); // Assuming eventId is 1
      if (!response.ok) {
        throw new Error('Failed to fetch event date');
      }
      const data = await response.json();
      setGuests(Array.isArray(data.guests) ? data.guests : []);
      setEventDate(`${data.event.event_date} ${data.event.event_start}`);
    } catch (error) {
      console.error('Error fetching event date:', error);
    }
  };

  useEffect(() => {
    fetchEventDate();
  }, []);

  const submitRSVPHandler = useCallback(async () => {
    try {
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: 1, // Assuming a default eventId for now
          ...formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit RSVP');
      }

      // Handle successful submission
      const responseData = await response.json();
      setUniqueId(responseData.unique_code);
      fetchEventDate();
      setScreenState(ScreenState.COUNTDOWN);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      // Handle error (e.g., show error message to user)
    }
  }, [formData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [parkingState, setParkingState] = useState<any>(null);

  const fetchParkingSlot = async () => {
    try {
      const response = await fetch('/api/parking_slot?eventId=1'); // Assuming eventId is 1
      if (!response.ok) {
        throw new Error('Failed to fetch parking slot data');
      }
      const data = await response.json();
      setParkingState(data); // Set the fetched data to the parking state
    } catch (error) {
      console.error('Error fetching parking slot data:', error);
    }
  };

  useEffect(() => {
    fetchParkingSlot();
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-0 py-0 bg-[#F6E8DE]">
      <Image src="/kawin1.png" alt="logo" width={391} height={600} />
      <Image src="/kawin2.png" alt="logo" width={393} height={576} />
      <Image src="/kawin3.png" alt="logo" width={393} height={404} />
      <Image src="/kawin4.png" alt="logo" width={393} height={458} />
      <Image src="/kawin5.png" alt="logo" width={393} height={458} />
      <div className="min-h-[70dvh] w-80 mb-16  flex flex-col items-center justify-between">
        {/* {screenState === ScreenState.INITIAL && InitialScreen(setScreenState)} */}
        {screenState === ScreenState.RSVP && RSVPScreen(availableTimes, submitRSVPHandler, formData, handleInputChange)}
        {screenState === ScreenState.COUNTDOWN && CountdownScreen(eventDate, timeLeft, setScreenState)}
        {screenState === ScreenState.PARKING_CHECK && parkingState && ParkingCheckScreen(parkingState, availableTimes, setScreenState)}
        {screenState === ScreenState.QR_CODE && QRCodeSection({ uniqueId, setScreenState })}
        {!!guests.length && <GreetingScreen guests={guests} />}
      </div>
    </section>
  );
}

// ScreenState Here
function InitialScreen(setScreenState: (state: ScreenState) => void) {
  return (
      <div className='flex flex-col gap-8 '>
        <h2 className="text-2xl font-bold text-center">Konfirmasi Kehadiran</h2>
        <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center gap-4">
          <p className="text-center">Pengen lancar waktu ke acara?
          konfirmasi kehadiran biar nggak ribet cari parkir</p>
          <Button 
            // onClick={() => setScreenState(ScreenState.SELECT_TIME)}
            className="bg-black text-white font-semibold"
          >
            Konfirmasi
          </Button>
        </div>
      </div>
  );
}

function RSVPScreen(availableTimes: any, submitRSVPHandler: () => void, formData: any, handleInputChange: (field: string, value: string) => void) {
  return (
    <div className='flex flex-col gap-4 w-full rounded-xl bg-white p-4 mt-8'>
        <Input
          label="Nama"
          placeholder="Masukkan nama Anda"
          className="max-w-xs"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
        />
        <Textarea
          label="Ucapan"
          placeholder="Tulis ucapan Anda"
          className="max-w-xs"
          value={formData.greeting}
          onChange={(e) => handleInputChange('greeting', e.target.value)}
        />
        <RadioGroup 
          label="Kehadiran"
          value={formData.attendance}
          onValueChange={(value) => handleInputChange('attendance', value)}
        >
          <Radio value="true">Saya akan hadir 🎉</Radio>
          <Radio value="false">Saya tidak hadir 🙏</Radio>
        </RadioGroup>
        <RadioGroup 
          label="Pilih Sesi"
          value={formData.session_preference}
          onValueChange={(value) => handleInputChange('session_preference', value)}
        >
          {availableTimes && availableTimes.map((time: any) => (
            <Radio key={time.id} value={time.start.toString()}>
              {time.start} - {time.end}
            </Radio>
          ))}
        </RadioGroup>
        <Button 
          onClick={submitRSVPHandler}
          className="bg-black text-white font-semibold"
        >
          Konfirmasi Kehadiran
        </Button>
        {cardFooter()}
    </div>
  );
}


// Countdown Screen in Week, Day, Hour, Minute, Second
function CountdownScreen(eventDate:any, timeLeft:any, setScreenState: (state: ScreenState) => void) {
  return (
    <div className='flex flex-col gap-4 w-full rounded-xl bg-white p-4 mt-8'>
      <div className="flex justify-center items-center gap-2">
        <span className="text-green-500 text-6xl">
          <FaCheckCircle />
        </span>
      </div>
      <h2 className="text-2xl font-bold text-center">Terima kasih telah konfirmasi kehadiran</h2>
      <p className="text-center">Acara akan dimulai pada</p>
      <p className="text-center font-semibold">{eventDate && moment(eventDate, 'YYYY-MM-DD HH:mm:ss').format('dddd, DD MMMM YYYY HH:mm')}</p>
      <p className="text-center">dan akan dimulai dalam</p>
      <div className="flex flex-row justify-center gap-4">
        <div className="flex flex-col items-center bg-gray-200 rounded-lg p-2">
          <span className="text-xl font-bold">{timeLeft.days}</span>
          <span>Hari</span>
        </div>
        <div className="flex flex-col items-center bg-gray-200 rounded-lg p-2">
          <span className="text-xl font-bold">{timeLeft.hours}</span>
          <span>Jam</span>
        </div>
        <div className="flex flex-col items-center bg-gray-200 rounded-lg p-2">
          <span className="text-xl font-bold">{timeLeft.minutes}</span>
          <span>Menit</span>
        </div>
        <div className="flex flex-col items-center bg-gray-200 rounded-lg p-2">
          <span className="text-xl font-bold">{timeLeft.seconds}</span>
          <span>Detik</span>
        </div>
      </div>
      <Button 
        onClick={() => setScreenState(ScreenState.PARKING_CHECK)}
        className="bg-blue-500 text-white font-semibold mt-4"
      >
        Cek Parkir
      </Button>
      {cardFooter()}
    </div>
  );
}

// greeting from rsvp response
function GreetingScreen(guests: any) {
  return (
    <div className='flex flex-col gap-4 w-full rounded-xl bg-white p-4 mt-4 overflow-y-auto max-h-96'>
      <h2 className="text-2xl font-bold text-center">Ucapan dari Tamu</h2>
      <div className="flex flex-col gap-4">
        {!!guests && guests.guests.map((guest: any) => (
          <div key={guest.id} className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-bold">{guest.name}<span className='font-normal'> | {guest.attendance ? '👋 Hadir' : '🚫 Tidak Hadir '}</span></h3>
            <p>{guest.greeting}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Parking Check Screen
function ParkingCheckScreen(parkingState: any, availableTimes: any, setScreenState: (state: ScreenState) => void) {
  const getColor = (value: number, maxValue: number) => {
    const percentage = value / maxValue;
    if (percentage > 0.75) {
      return 'text-red-500 bg-red-100';  // more than 75%, red
    } else if (percentage > 0.5) {
      return 'text-yellow-500 bg-yellow-100';  // 50% - 75%, yellow
    } else if (percentage > 0.25) {
      return 'text-yellow-300 bg-yellow-50';  // 25% - 50%, lighter yellow
    } else {
      return 'text-green-500 bg-green-100';  // less than 25%, green
    }
  };
  
  const ProgressCard = ({ value, maxValue, emoji, nextAvailable }: { value: number; maxValue: number; emoji: string; nextAvailable: string }) => {
    const colorClass = getColor(value, maxValue);
    const progressWidth = (value / maxValue) * 100;
  
    return (
      <div className={`flex flex-col items-center ${colorClass.split(' ')[1]} rounded-lg overflow-hidden py-4 w-1/2`}>
        <div className={`h-full ${colorClass.split(' ')[0]}`} style={{ width: `${progressWidth}%` }}></div>
        <span className={`relative text-2xl ${colorClass.split(' ')[0]} font-bold flex-grow text-center`}>
          {value === maxValue ? 'Penuh!' : `${value}/${maxValue}`} <span className="text-3xl">{emoji}</span>
        </span>
        {value === maxValue && nextAvailable && (
          <p className="text-center text-sm text-gray-500 mt-2">
            Estimasi tersedia: {nextAvailable}
          </p>
        )}
      </div>
    );
  };

  const getNextAvailableTime = (vehicleType: string) => {
    if (!availableTimes) return null;
    const nextSession = availableTimes.find((session: any) => session.vehicleType === vehicleType && session.available);
    return nextSession ? nextSession.time : 'Tidak ada sesi berikutnya';
  };

  return (
    <div className='flex flex-col gap-4 w-full rounded-xl bg-white p-4 mt-8'>
      <h2 className="text-2xl font-bold text-center">Parkir Tersedia</h2>
      <div className="flex flex-col gap-2 items-center">
        <ProgressCard 
          value={parkingState.occupiedCarSlots} 
          maxValue={parkingState.carSlots} 
          emoji="🚗" 
          nextAvailable={getNextAvailableTime('car')} 
        />
        <ProgressCard 
          value={parkingState.occupiedMotorcycleSlots} 
          maxValue={parkingState.motorcycleSlots} 
          emoji="🛵" 
          nextAvailable={getNextAvailableTime('motorcycle')} 
        />
        <Button 
          className="bg-blue-500 text-white font-semibold mt-4"
          onClick={() => setScreenState(ScreenState.QR_CODE)}
          fullWidth
        >
          Lihat QR Parkir Saya
        </Button>
        <p className="text-center text-sm font-semibold mt-2">
          Mengalami Kendala? <a href="tel:+123456789" className="text-blue-500">Hubungi Kami</a>
        </p>
      </div>
      {cardFooter()}
    </div>
  );
}

import QRCode, { QRCodeSVG } from 'qrcode.react'; // Ensure you have this import at the top of your file

const QRCodeSection = ({ uniqueId, setScreenState }: { uniqueId: string; setScreenState: (state: ScreenState) => void }) => {
  return (
    <div className='flex flex-col gap-4 w-full rounded-xl bg-white p-4 mt-8'>
      <h2 className="text-2xl font-bold text-center">QR Code Parkir</h2>
      {uniqueId ? (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-lg border border-gray-300">
            <QRCodeSVG value={uniqueId} size={200} />
          </div>
          <div>
            <p className="text-lg text-center">Kode Parkir Anda</p>
            <div className="bg-gray-200 rounded-lg p-2 ">
              <p className="text-xl font-bold text-center">{uniqueId}</p>
            </div>
          </div>
          <p className="text-center text-sm font-semibold">
            Mengalami kendala? <a href="tel:+123456789" className="text-blue-500 underline">Hubungi Kami</a>
          </p>
        <Button 
          className="bg-gray-300 text-black font-semibold mt-4"
          onClick={() => setScreenState(ScreenState.PARKING_CHECK)}
          fullWidth
        >
          Kembali
        </Button>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500">Silakan konfirmasi kehadiran untuk mendapatkan QR Code.</p>
      )}
      {cardFooter()}
    </div>
  );
};


function cardFooter() {
  return (
    <div className="flex flex-col justify-between items-center">
      <div className='flex gap-2'>
        Powered by
        <Image src="/prlandscapelogo.png" alt="Parkirapi" width={127} height={27} />
      </div>
      <div>
        <p className="text-sm font-semibold text-center">
          "Jasa atur parkir event"
        </p>
      </div>
    </div>
  );
}




