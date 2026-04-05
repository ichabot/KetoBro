"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScan = useCallback((code: string) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    
    // Stop scanner first, then callback
    const scanner = scannerRef.current;
    if (scanner) {
      scanner.stop().catch(() => {}).finally(() => {
        scannerRef.current = null;
        onScan(code);
      });
    } else {
      onScan(code);
    }
  }, [onScan]);

  const handleClose = useCallback(() => {
    const scanner = scannerRef.current;
    if (scanner) {
      scanner.stop().catch(() => {}).finally(() => {
        scannerRef.current = null;
        onClose();
      });
    } else {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted) return;

        const elementId = "ketobro-barcode-reader";
        
        // Ensure container element exists
        if (containerRef.current && !document.getElementById(elementId)) {
          const el = document.createElement("div");
          el.id = elementId;
          containerRef.current.appendChild(el);
        }

        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            if (mounted) handleScan(decodedText);
          },
          () => {} // ignore scan failures
        );

        if (mounted) setReady(true);
      } catch (err) {
        console.error("Scanner init error:", err);
        if (mounted) {
          setError("Kamera-Zugriff nicht möglich. Bitte Kamera-Berechtigung erteilen.");
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [handleScan]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-semibold">📷 Barcode scannen</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>✕</Button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📷</div>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <Button onClick={handleClose} variant="outline">Schließen</Button>
            </div>
          ) : (
            <>
              <div ref={containerRef} className="rounded-lg overflow-hidden bg-black min-h-[200px]" />
              {!ready && (
                <div className="text-center py-4">
                  <span className="inline-block w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 mt-2">Kamera wird gestartet...</p>
                </div>
              )}
              {ready && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                  Halte den Barcode vor die Kamera...
                </p>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          <Button onClick={handleClose} variant="outline" className="w-full">Abbrechen</Button>
        </div>
      </div>
    </div>
  );
}
