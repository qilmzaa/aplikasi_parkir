import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { cn } from '../lib/cn';

/**
 * Barcode Code 128 berbasis SVG.
 * Dipakai untuk label kendaraan dan barcode tiket pada struk.
 */
export default function Barcode({
  value,
  height = 52,
  width = 1.6,
  fontSize = 12,
  displayValue = true,
  className,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, String(value), {
        format: 'CODE128',
        width,
        height,
        displayValue,
        fontSize,
        textMargin: 4,
        margin: 0,
        lineColor: '#0f172a',
        background: '#ffffff',
        font: 'monospace',
        fontOptions: 'bold',
      });
    } catch {
      // Abaikan nilai yang tidak dapat di-encode; UI tetap menampilkan kode teks.
    }
  }, [value, height, width, fontSize, displayValue]);

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={`Barcode ${value || ''}`}
      className={cn('mx-auto block max-w-full', className)}
    />
  );
}
