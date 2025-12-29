import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from 'react-bootstrap';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0], // 0 = Camera
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ]
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      (error) => {
        // Ignorar errores de lectura comunes
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Error clearing scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark" 
      style={{ zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.9)' }}
    >
      <div className="w-100 p-3 text-end">
        <Button variant="outline-light" onClick={onClose} className="rounded-circle">
          <X size={24} />
        </Button>
      </div>
      <div id="reader" style={{ width: '100%', maxWidth: '500px' }}></div>
      <div className="text-light mt-3 p-3 text-center">
        <p>Apunta la cámara al código de barras del producto</p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
