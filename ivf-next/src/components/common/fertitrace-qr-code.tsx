'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface FertiTraceQRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function FertiTraceQRCode({ value, size = 120, className = '' }: FertiTraceQRCodeProps) {
  const [svgString, setSvgString] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setSvgString('');
      return;
    }

    QRCode.toString(value, {
      type: 'svg',
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((svg) => {
        setSvgString(svg);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to generate SVG QR code:', err);
        setError('QR Error');
      });
  }, [value, size]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center border border-red-200 bg-red-50 text-[10px] text-red-600 font-mono ${className}`}
        style={{ width: size, height: size }}
      >
        {error}
      </div>
    );
  }

  if (!svgString) {
    return (
      <div
        className={`animate-pulse bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-mono ${className}`}
        style={{ width: size, height: size }}
      >
        Generating...
      </div>
    );
  }

  return (
    <div
      className={`inline-block select-none ${className}`}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
