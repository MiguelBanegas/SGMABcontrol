import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button, Alert } from 'react-bootstrap';
import { X, ShieldAlert, Settings } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
  const isSecure = window.isSecureContext;
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
  }, [onScan, isSecure]);

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
      <div id="reader" style={{ width: '100%', maxWidth: '500px', display: isSecure ? 'block' : 'none' }}></div>
      
      {!isSecure && (
        <div className="container" style={{ maxWidth: '500px' }}>
          <Alert variant="warning" className="shadow-lg border-0">
            <div className="d-flex align-items-center mb-3">
              <ShieldAlert className="me-2 text-danger" size={32} />
              <h5 className="mb-0 fw-bold text-dark">Conexión no segura detectada</h5>
            </div>
            <p className="small text-muted mb-3">
              Chrome/Edge bloquean la cámara en redes locales (HTTP) por seguridad. 
              Para que funcione en este dispositivo:
            </p>
            <ol className="small ps-3 mb-3">
              <li className="mb-2">Abre <b>chrome://flags/#unsafely-treat-insecure-origin-as-secure</b></li>
              <li className="mb-2">Cambia a <b>Enabled</b></li>
              <li className="mb-2 text-break">Escribe tu IP: <b>{window.location.origin}</b></li>
              <li>Toca <b>Relaunch</b> (Reiniciar)</li>
            </ol>
            <div className="d-grid">
              <Button variant="dark" onClick={onClose} size="sm">
                Entendido
              </Button>
            </div>
          </Alert>
        </div>
      )}

      <div className="text-light mt-3 p-3 text-center">
        {isSecure ? (
          <p>Apunta la cámara al código de barras del producto</p>
        ) : (
          <p className="small text-secondary">Nota: Las funciones de la cámara requieren HTTPS o configuración manual para IPs locales.</p>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
