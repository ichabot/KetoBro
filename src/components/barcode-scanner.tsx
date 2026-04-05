"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted || !scannerRef.current) return;

        const scannerId = "barcode-scanner-element";
        
        // Create element if not exists
        if (!document.getElementById(scannerId)) {
          const el = document.createElement("div");
          el.id = scannerId;
          scannerRef.current.appendChild(el);
        }

        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, // Rear camera
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            // Success
            html5QrCode.stop().catch(() => {});
            setScanning(false);
            onScan(decodedText);
          },
          () => {
            // Scan failure - normal, keep scanning
          }
        );
      } catch (err) {
        if (mounted) {
          console.error("Scanner error:", err);
          setError(
            "Kamera-Zugriff nicht möglich. Bitte erlaube den Kamera-Zugriff in deinen Browser-Einstellungen."
          );
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-semibold">📷 Barcode scannen</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📷❌</div>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <Button onClick={onClose} variant="outline">Schließen</Button>
            </div>
          ) : (
            <>
              <div ref={scannerRef} className="rounded-lg overflow-hidden" />
              {scanning && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                  Halte den Barcode vor die Kamera...
                </p>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          <Button onClick={onClose} variant="outline" className="w-full">Abbrechen</Button>
        </div>
      </div>
    </div>
  );
}
