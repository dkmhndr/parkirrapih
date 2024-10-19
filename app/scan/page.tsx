"use client"

import { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { Card } from "@nextui-org/card";
import { title } from "@/components/primitives";

export default function ScanPage() {
  const [data, setData] = useState('No result');

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>QR Code Scanner</span>
      </div>

      <Card className="p-6 w-full max-w-md">
        <QrReader
          constraints={{ facingMode: 'environment' }}
          onResult={(result, error) => {
            if (!!result) {
              setData(result.getText());
            }

            if (!!error) {
              console.error(error);
            }
          }}
        />
      </Card>

      {data !== 'No result' && (
        <Card className="mt-6 p-4">
          <p>Scanned Result: {data}</p>
        </Card>
      )}
    </section>
  );
}
