"use client"

import { useCallback, useEffect, useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { Card } from "@nextui-org/card";
import { title } from "@/components/primitives";
import Image from 'next/image';
import { FaBell, FaCheckCircle, FaQuestionCircle } from 'react-icons/fa';
import { Button } from '@nextui-org/button';
import { LuScanLine } from 'react-icons/lu';
import { Input } from '@nextui-org/input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@nextui-org/react';
import { MdQrCodeScanner } from 'react-icons/md';
import moment from 'moment';
import { Spinner } from '@nextui-org/react'; // Import Spinner from NextUI
import { FaChevronCircleLeft } from 'react-icons/fa';
import { on } from 'events';

enum ScreenState {
  PARKING_CHECK,
  SCAN_QR_CODE,
  PARKING_PAYMENT,
  QRIS,
}

export default function ScanPage() {
  const [data, setData] = useState('No result');
  const [screenState, setScreenState] = useState(ScreenState.PARKING_CHECK);
  const [qrCode, setQrCode] = useState('');
  const [qrCodeError, setQrCodeError] = useState('');
  const [eventData, setEventData] = useState<any>(null);
  const [parkingState, setParkingState] = useState<any>(null);
  const { isOpen: isOpenModalInputManual, onOpen: onOpenModalInputManual, onOpenChange: onOpenChangeModalInputManual } = useDisclosure();
  const { isOpen: isOpenModalScanSuccessful, onOpen: onOpenModalScanSuccessful, onOpenChange: onOpenChangeModalScanSuccessful } = useDisclosure();
  const { isOpen: isOpenParkSuccessModal, onOpen: onOpenParkSuccessModal, onOpenChange: onOpenChangeParkSuccessModal } = useDisclosure();
  const { isOpen: isOpenCapacityErrorModal, onOpen: onOpenCapacityErrorModal, onOpenChange: onOpenChangeCapacityErrorModal } = useDisclosure(); // Modal for capacity error
  const [manualCode, setManualCode] = useState('');
  const [loadingEvent, setLoadingEvent] = useState(false); // Loading state for event data
  const [loadingParking, setLoadingParking] = useState(false); // Loading state for parking slot data
  const [currentParking, setCurrentParking] = useState<any>(null);

  const getCurrentTimeOfDay = () => {
    const hours = new Date().getHours();
    if (hours < 12) {
      return 'Pagi';
    } else if (hours < 18) {
      return 'Siang';
    } else {
      return 'Sore';
    }
  };

  const currentTimeOfDay = getCurrentTimeOfDay();

  const fetchEventData = async () => {
    setLoadingEvent(true); // Set loading state to true
    try {
      const response = await fetch('/api/events?eventId=1'); // Assuming eventId is 1
      if (!response.ok) {
        throw new Error('Failed to fetch event date');
      }
      const data = await response.json();
      setEventData(data);
    } catch (error) {
      console.error('Error fetching event date:', error);
    } finally {
      setLoadingEvent(false); // Set loading state to false
    }
  };

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchParkingSlot = async () => {
    setLoadingParking(true); // Set loading state to true
    try {
      const response = await fetch('/api/parking_slot?eventId=1'); // Assuming eventId is 1
      if (!response.ok) {
        throw new Error('Failed to fetch parking slot data');
      }
      const data = await response.json();
      setParkingState(data); // Set the fetched data to the parking state
    } catch (error) {
      console.error('Error fetching parking slot data:', error);
    } finally {
      setLoadingParking(false); // Set loading state to false
    }
  };

  useEffect(() => {
    fetchParkingSlot();
  }, []);

  const handleManualInput = () => {
    setQrCode(manualCode);
    setScreenState(ScreenState.PARKING_PAYMENT);
  }

  useEffect(() => {
    const checkParkingSlot = async () => {
      if (qrCode) {
        try {
          const response = await fetch(`/api/parkings?qrCode=${qrCode}`);
          if (!response.ok) {
            throw new Error('Failed to fetch parking slot data');
          }
          const data = await response.json();
          setCurrentParking(data);
          if (data.length === 0) {
            onOpenChangeModalScanSuccessful();
          } else {
            if(data[0].park_out) {
              setScreenState(ScreenState.PARKING_CHECK);
              setQrCode(''); // Reset qrCode when going back to PARKING_CHECK
              onOpenChangeModalScanSuccessful();
            }
            setScreenState(ScreenState.PARKING_PAYMENT);
          }
        } catch (error) {
          console.error('Error checking or creating parking slot:', error);
        }
      }
    };

    checkParkingSlot();
  }, [qrCode]);

  const handleVehicleType = useCallback(async (type: string) => {
    try {
      const parkingData = {
        event_id: eventData?.event?.id, // Assuming you have the event ID
        unique_code: qrCode,
        vehicle_type: type,
        plate_number: 'some_plate_number', // Replace with actual plate number
        park_in: moment().format('HH:mm:ss'), // Current time as park in time in HH:mm:ss format
      };

      const response = await fetch('/api/parkings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parkingData),
      });

      if (!response.ok) {
        throw new Error('Failed to create parking data');
      }

      const data = await response.json();

      // Check if parking capacity is full
      if ((type === 'car' && parkingState.occupiedCarSlots >= parkingState.carSlots) ||
          (type === 'motorcycle' && parkingState.occupiedMotorcycleSlots >= parkingState.motorcycleSlots)) {
        onOpenCapacityErrorModal(); // Open modal for capacity error
        return; // Exit if capacity is full
      }

      fetchParkingSlot();
      setScreenState(ScreenState.PARKING_CHECK);
      // Handle success (e.g., show a success message or navigate to another screen)
    } catch (error) {
      console.error('Error creating parking data:', error);
      setScreenState(ScreenState.PARKING_CHECK);
      // Handle error (e.g., show an error message)
    }
  }, [eventData, qrCode, parkingState]);

  const handlePayment = useCallback(async () => {
    const parkingDataUpdate = {
      unique_code: qrCode,
      park_out: moment().format('HH:mm:ss'), // Current time as park out time in HH:mm:ss format
    };

    const responseUpdate = await fetch('/api/parkings/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parkingDataUpdate),
    });

    const dataUpdate = await responseUpdate.json();
    // Handle success (e.g., show a success message or navigate to another screen)
    console.log('Parking data updated successfully:', dataUpdate);

    resetQR();
  }, []);

  const resetQR = useCallback(() => {
    setQrCode('');
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-0 py-0 min-w-96">
      {loadingEvent || loadingParking ? ( // Show loading state
        <div className="flex flex-col items-center justify-center h-dvh">
          <Spinner size="lg" /> {/* Use NextUI Spinner */}
          <p className="mt-2 text-gray-500">Mohon tunggu sebentar...</p>
        </div>
      ) : (
        <>
          {screenState === ScreenState.PARKING_CHECK && (
            <div className="w-full mx-auto px-4 py-8 flex flex-col items-center">
              <div className="flex justify-between items-center w-full">
                <Image src="/prlandscapeinverse.png" alt="Logo" width={228} height={46} />
                <button className="text-gray-500 focus:outline-none" aria-label="Notifications">
                  <FaBell className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col items-start p-4 w-full">
                <h1 className="text-xl font-bold text-left">
                  Selamat {currentTimeOfDay}, Dayat The Parkers
                </h1>
                <p className="text-sm text-left text-gray-500">
                  Mari semangat kerja!
                </p>
                <div className="bg-gray-200 rounded-lg p-4 w-full mt-4">
                  <div className="flex flex-col">
                    <div className="mb-2">
                      <span>Acara: </span>
                      <span className='font-bold'>{eventData?.event?.name}</span>
                    </div>
                    <div className="mb-2">
                      <span>Waktu: </span>
                      <span className='font-bold'>{eventData?.event?.event_start} - {eventData?.event?.event_end}</span>
                    </div>
                    <div className="flex w-full justify-evenly gap-2 mt-4">
                      <Button fullWidth variant='bordered' color="primary" onClick={() => { window.location.href = '/'; }}>
                        Detail Acara
                      </Button>
                      <Button fullWidth color="primary" onClick={() => { setScreenState(ScreenState.SCAN_QR_CODE); }} startContent={<LuScanLine />}>
                        Scan QR
                      </Button>
                    </div>
                  </div>
                </div>
                <ParkingCheckScreen {...parkingState} />
              </div>
            </div>
          )}
          {screenState === ScreenState.SCAN_QR_CODE && (
            <QrCodeScanner onScan={(data) => setQrCode(data)} onOpenChangeModalInputManual={onOpenChangeModalInputManual} setScreenState={setScreenState} resetQR={resetQR} />
          )}
          {
            screenState === ScreenState.PARKING_PAYMENT && (
              <ParkingPaymentScreen setScreenState={setScreenState} onOpenParkSuccessModal={onOpenParkSuccessModal} handlePayment={handlePayment} resetQR={resetQR} />
            )
          }
          {
            screenState === ScreenState.QRIS && (
              <ShowQrisScreen setScreenState={setScreenState}/>
            )
          }
          <InputManualModal isOpen={isOpenModalInputManual} onOpenChange={onOpenChangeModalInputManual} handleManualInput={handleManualInput} manualCode={manualCode} setManualCode={setManualCode} />
          <ScanSuccessfulModal isScanSuccessful={isOpenModalScanSuccessful} setScanSuccessful={onOpenChangeModalScanSuccessful} handleVehicleType={(type) => handleVehicleType(type)} />
          <ParkSuccessModal isOpenParkSuccessModal={isOpenParkSuccessModal} onOpenChangeParkSuccessModal={onOpenChangeParkSuccessModal} />
          <CapacityErrorModal isOpen={isOpenCapacityErrorModal} onOpenChange={onOpenChangeCapacityErrorModal} /> {/* New modal for capacity error */}
        </>
      )}
    </section>
  );
}

function ParkingCheckScreen(parkingState: any) {
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

  const ProgressCard = ({ value, maxValue, emoji }: { value: number; maxValue: number; emoji: string }) => {
    const colorClass = getColor(value, maxValue);
    const progressWidth = (value / maxValue) * 100;

    return (
      <div className={`flex flex-col items-center ${colorClass.split(' ')[1]} rounded-lg overflow-hidden py-4 w-full`}>
        <div className={`h-full ${colorClass.split(' ')[0]}`} style={{ width: `${progressWidth}%` }}></div>
        <span className={`relative text-2xl ${colorClass.split(' ')[0]} font-bold flex-grow text-center`}>
          {value === maxValue ? 'Penuh!' : `${value}/${maxValue}`} <span className="text-3xl">{emoji}</span>
        </span>
      </div>
    );
  };

  return (
    <div className='flex flex-col gap-4 w-full rounded-xl bg-white mt-8'>
      <h2 className="font-bold text-left">Kondisi Parkiran</h2>
      <div className="flex flex-col gap-2 items-center">
        <ProgressCard
          value={parkingState.occupiedCarSlots}
          maxValue={parkingState.carSlots}
          emoji="🚗"
        />
        <ProgressCard
          value={parkingState.occupiedMotorcycleSlots}
          maxValue={parkingState.motorcycleSlots}
          emoji="🛵"
        />
      </div>
    </div>
  );
}

function QrCodeScanner({ onScan, onOpenChangeModalInputManual, setScreenState, resetQR }: { onScan: (data: string) => void; onOpenChangeModalInputManual: () => void; setScreenState: (state: ScreenState) => void; resetQR: () => void }) {
  const handleScan = (data: string | null) => {
    if (data) {
      onScan(data);
    }
  };

  const handleError = (error: any) => {
    console.error('QR code scan error:', error);
  };

  return (
    <div className='w-full h-full mx-auto px-4 py-8 flex flex-col items-center'>
      <div className="flex justify-between items-center w-full">
        <button className="text-gray-500 focus:outline-none" aria-label="Close" onClick={() => {
          resetQR();
          setScreenState(ScreenState.PARKING_CHECK)}}>
          <span className="text-2xl"><FaChevronCircleLeft/></span>
        </button>
        <h2 className="text-lg font-bold">Scan QR</h2>
        <button className="text-gray-500 focus:outline-none" aria-label="Help">
          <FaQuestionCircle className="h-6 w-6" />
        </button>
      </div>
      <div className='w-full h-full'>
        <QrReader
          constraints={{ facingMode: 'environment' }}
          onResult={
            (result: any) => {
              if (result) {
                onScan(result.getText());
              }
            }
          }
        />
      </div>
      <Button onClick={() => onOpenChangeModalInputManual()} className="mt-4">
        Tidak bisa scan? Input Manual
      </Button>
    </div>
  );
}

function InputManualModal({ isOpen, onOpenChange, handleManualInput, manualCode, setManualCode }: { isOpen: boolean; onOpenChange: () => void; handleManualInput: () => void; manualCode: string; setManualCode: (code: string) => void }) {
  return (
    <Modal
      closeButton
      isOpen={isOpen}
      onOpenChange={(open) => onOpenChange()}
      title="Input Kode Manual"
    >
      <ModalContent className="flex flex-col gap-1">
        <ModalHeader></ModalHeader>
        <ModalBody>
          <div className="flex items-center mb-2 text-center text-primary text-6xl">
            <MdQrCodeScanner className='mx-auto' />
          </div>
          <h2 className="text-center text-lg font-semibold">Input Kode Parkir</h2>
          <Input
            label="Masukkan Kode"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => onOpenChange()} color="danger" variant='bordered'>
            Cancel
          </Button>
          <Button onClick={handleManualInput} color="primary">
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

function ScanSuccessfulModal({ isScanSuccessful, setScanSuccessful, handleVehicleType }: { isScanSuccessful: boolean; setScanSuccessful: (open: boolean) => void; handleVehicleType: (type: string) => void }) {
  return (
    <Modal
      closeButton
      isOpen={isScanSuccessful}
      onOpenChange={(open) => setScanSuccessful(open)}
      title="Scan Successful"
    >
      <ModalContent className="flex flex-col gap-1">
        <ModalHeader>
        </ModalHeader>
        <ModalBody>
          <div className="text-center">
            <div className="flex items-center mb-2 text-center text-primary text-6xl">
              <FaCheckCircle className='mx-auto' />
            </div>
            <h2 className="text-center text-lg font-semibold">Parkir Berhasil</h2>
            <p>Pilih Jenis Kendaraan</p>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <Button onClick={() => handleVehicleType('car')} color="primary" size="lg">
              Mobil 🚗
            </Button>
            <Button onClick={() => handleVehicleType('motorcycle')} color="primary" size="lg">
              Motor 🛵
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function ParkingPaymentScreen({ setScreenState, onOpenParkSuccessModal, handlePayment, resetQR }: { setScreenState: (state: ScreenState) => void; onOpenParkSuccessModal: () => void; handlePayment: () => void; resetQR: () => void }) {
  const [paymentMethod, setPaymentMethod] = useState('');
  return (
  <div className='w-full h-full mx-auto px-4 py-8 flex flex-col items-center'>
    <div className="flex justify-between items-center w-full">
      <button className="text-gray-500 focus:outline-none" aria-label="Close" onClick={() => {
        resetQR();
        setScreenState(ScreenState.PARKING_CHECK)}}>
        <span className="text-2xl"><FaChevronCircleLeft/></span>
      </button>
      <h2 className="text-lg font-bold">Pilih Pembayaran</h2>
      <button className="text-gray-500 focus:outline-none" aria-label="Help">
        <FaQuestionCircle className="h-6 w-6" />
      </button>
    </div>
    <div className="flex flex-col text-center h-dvh items-center justify-center">
      <div className="flex items-center mb-2 text-center text-primary text-6xl">
        <MdQrCodeScanner className='mx-auto' />
      </div>
      <h2 className="text-center text-lg font-semibold">Pembayaran</h2>
      <p>Pilih metode Pembayaran</p>
      <div className="flex justify-center gap-4 mt-4">
        {paymentMethod === 'cash' ? (
          <Button onClick={() => {
            handlePayment();
            setScreenState(ScreenState.PARKING_CHECK);
            setPaymentMethod('');
            onOpenParkSuccessModal();
          }} color="primary" size="lg">
            Konfirmasi
          </Button>
        ) : (
          <Button onClick={() => {setPaymentMethod('cash')}} color="primary" size="lg">
            Cash 💵
          </Button>
        )}
        <Button onClick={() => {
          handlePayment();
          setPaymentMethod('');
          setScreenState(ScreenState.QRIS)
          }} color="primary" size="lg">
          E-Wallet 📱
        </Button>
      </div>
    </div>
  </div>);
}

function ShowQrisScreen({ setScreenState }: { setScreenState: (state: ScreenState) => void }) {
  return (
  <div className='w-full h-full mx-auto px-4 py-8 flex flex-col items-center'>
    <div className="flex justify-between items-center w-full">
      <button className="text-gray-500 focus:outline-none" aria-label="Close" onClick={() => setScreenState(ScreenState.PARKING_PAYMENT)}>
        <span className="text-2xl"><FaChevronCircleLeft/></span>
      </button>
      <h2 className="text-lg font-bold">Pilih Pembayaran</h2>
      <button className="text-gray-500 focus:outline-none" aria-label="Help">
        <FaQuestionCircle className="h-6 w-6" />
      </button>
    </div>
    <div className="flex flex-col text-center h-dvh items-center justify-center">
      <Image src="/qris.png" alt="QRIS" width={337} height={462} />
      <div className="flex justify-center gap-4 mt-4">
        <Button fullWidth onClick={()=>setScreenState(ScreenState.PARKING_CHECK)} color="primary" size="lg">
          Tutup
        </Button>
      </div>
    </div>
  </div>);
}

function ParkSuccessModal({ isOpenParkSuccessModal, onOpenChangeParkSuccessModal }: { isOpenParkSuccessModal: boolean; onOpenChangeParkSuccessModal: () => void }) {
  return (
    <Modal
      closeButton
      isOpen={isOpenParkSuccessModal}
      onOpenChange={() => onOpenChangeParkSuccessModal()}
      title="Parking Successful"
    >
      <ModalContent className="flex flex-col gap-1">
        <ModalHeader>
        </ModalHeader>
        <ModalBody>
          <div className="text-center">
            <div className="flex items-center mb-2 text-center text-primary text-6xl">
              <FaCheckCircle className='mx-auto' />
            </div>
            <h2 className="text-center text-lg font-semibold">Pembayaran Berhasil</h2>
            <p>Kendaraan boleh keluar.</p>
            <div className="flex justify-center gap-4 mt-4">
              <Button fullWidth onClick={() => onOpenChangeParkSuccessModal()} color="primary">
                Tutup
              </Button>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function CapacityErrorModal({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: () => void }) {
  return (
    <Modal
      closeButton
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Kapasitas Penuh"
    >
      <ModalContent className="flex flex-col gap-1">
        <ModalHeader>
        </ModalHeader>
        <ModalBody>
          <div className="text-center">
            <h2 className="text-center text-lg font-semibold">Maaf, kapasitas parkir untuk kendaraan ini sudah penuh.</h2>
            <p>Silakan coba lagi nanti.</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onOpenChange} color="primary">
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}