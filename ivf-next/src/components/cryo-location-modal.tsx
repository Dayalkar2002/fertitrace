'use client';

import React, { useState, useEffect } from 'react';

export interface CryoPaletteItem {
  code: string;
  name: string;
  bg: string;
  fg: string;
  border?: boolean;
}

export const CRYO_PALETTE: CryoPaletteItem[] = [
  { code: 'BL', name: 'BL-BLUE', bg: '#0000FF', fg: '#FFA500' },
  { code: 'PK', name: 'PK-PINK', bg: '#FFC0CB', fg: '#008000' },
  { code: 'BK', name: 'BK-BLACK', bg: '#000000', fg: '#FFFFFF' },
  { code: 'BR', name: 'BR-BROWN', bg: '#8B4513', fg: '#0000FF' },
  { code: 'GN', name: 'GN-GREEN', bg: '#008000', fg: '#FF0000' },
  { code: 'RD', name: 'RD-RED', bg: '#FF0000', fg: '#008000' },
  { code: 'WT', name: 'WT-WHITE', bg: '#FFFFFF', fg: '#000000', border: true },
  { code: 'YL', name: 'YL-YELLOW', bg: '#FFFF00', fg: '#8A2BE2' },
  { code: 'GY', name: 'GY-GRAY', bg: '#808080', fg: '#0000FF' },
  { code: 'OR', name: 'OR-ORANGE', bg: '#FFA500', fg: '#00BFFF' },
  { code: 'VT', name: 'VT-VIOLET', bg: '#8A2BE2', fg: '#008000' },
  { code: 'CR', name: 'CR-CRIMSON', bg: '#DC143C', fg: '#FFFF00' },
  { code: 'MR', name: 'MR-MAROON', bg: '#800000', fg: '#008000' },
  { code: 'OL', name: 'OL-OLIVE', bg: '#808000', fg: '#FFFFFF' },
  { code: 'LM', name: 'LM-LIME', bg: '#32CD32', fg: '#8A2BE2' },
  { code: 'AQ', name: 'AQ-AQUA', bg: '#00FFFF', fg: '#8A2BE2' },
  { code: 'GD', name: 'GD-GOLD', bg: '#FFD700', fg: '#4B5563' },
  { code: 'SL', name: 'SL-SILVER', bg: '#C0C0C0', fg: '#1F2937' },
  { code: 'FU', name: 'FU-FUCHSIA', bg: '#FF00FF', fg: '#0000FF' },
  { code: 'TL', name: 'TL-TEAL', bg: '#008080', fg: '#FF0000' },
];

export function getColorStyle(code: string) {
  const found = CRYO_PALETTE.find((c) => c.code === code.trim().toUpperCase());
  if (found) {
    return {
      backgroundColor: found.bg,
      color: found.fg,
      borderColor: found.border ? '#cbd5e1' : undefined,
    };
  }
  return {};
}

interface CryoLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: string;
  title?: string;
  subtitle?: string;
  onApply: (formattedLocation: string) => void;
  existingLocations?: string[];
}

export function CryoLocationModal({
  isOpen,
  onClose,
  initialLocation = '',
  title = 'SMART Cryopreservation Location',
  subtitle,
  onApply,
  existingLocations = [],
}: CryoLocationModalProps) {
  const [locType, setLocType] = useState<'Straw' | 'Cryovial'>('Straw');

  // Straw fields
  const [strawECC, setStrawECC] = useState('');
  const [strawEC, setStrawEC] = useState('');
  const [strawGO, setStrawGO] = useState('');
  const [strawVE, setStrawVE] = useState('');
  const [strawVI, setStrawVI] = useState('');
  const [strawST, setStrawST] = useState('');

  // Cryovial fields
  const [cryoCC, setCryoCC] = useState('');
  const [cryoC, setCryoC] = useState('');
  const [cryoCH, setCryoCH] = useState('');
  const [cryoCV, setCryoCV] = useState('');
  const [cryoColor, setCryoColor] = useState('');

  const [activeColorField, setActiveColorField] = useState<'GO' | 'VE' | 'VI' | 'ST' | 'CV_COLOR'>('GO');
  const [error, setError] = useState('');

  // Parse initial location when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const loc = (initialLocation || '').trim();

    if (loc.includes('/CH-')) {
      setLocType('Cryovial');
      const m = loc.match(/CC-([^/]*)\/C-([^/]*)\/CH-([^/]*)\/CV-([^-]*)-?(.*)/i);
      if (m) {
        setCryoCC(m[1] || '');
        setCryoC(m[2] || '');
        setCryoCH(m[3] || '');
        setCryoCV(m[4] || '');
        setCryoColor(m[5] || '');
      } else {
        setCryoCC('');
        setCryoC('');
        setCryoCH('');
        setCryoCV('');
        setCryoColor('');
      }
      setActiveColorField('CV_COLOR');
    } else {
      setLocType('Straw');
      const m = loc.match(/CC-([^/]*)\/C-([^/]*)\/GO-([^/]*)\/VE-([^/]*)\/VI-([^/]*)\/ST-([^/]*)/i);
      if (m) {
        setStrawECC(m[1] || '');
        setStrawEC(m[2] || '');
        setStrawGO(m[3] || '');
        setStrawVE(m[4] || '');
        setStrawVI(m[5] || '');
        setStrawST(m[6] || '');
      } else {
        setStrawECC('');
        setStrawEC('');
        setStrawGO('');
        setStrawVE('');
        setStrawVI('');
        setStrawST('');
      }
      setActiveColorField('GO');
    }
  }, [isOpen, initialLocation]);

  if (!isOpen) return null;

  function handleSelectColor(code: string) {
    if (locType === 'Straw') {
      if (activeColorField === 'GO') {
        setStrawGO(code);
        setActiveColorField('VE');
      } else if (activeColorField === 'VE') {
        setStrawVE(code);
        setActiveColorField('VI');
      } else if (activeColorField === 'VI') {
        setStrawVI(code);
        setActiveColorField('ST');
      } else if (activeColorField === 'ST') {
        setStrawST(code);
      }
    } else {
      setCryoColor(code);
    }
  }

  const generatedCoordinate =
    locType === 'Straw'
      ? `CC-${strawECC.trim().toUpperCase()}/C-${strawEC.trim().toUpperCase()}/GO-${strawGO.trim().toUpperCase()}/VE-${strawVE.trim().toUpperCase()}/VI-${strawVI.trim().toUpperCase()}/ST-${strawST.trim().toUpperCase()}`
      : `CC-${cryoCC.trim().toUpperCase()}/C-${cryoC.trim().toUpperCase()}/CH-${cryoCH.trim().toUpperCase()}/CV-${cryoCV.trim().toUpperCase()}-${cryoColor.trim().toUpperCase()}`;

  const isComplete =
    locType === 'Straw'
      ? Boolean(strawECC.trim() && strawEC.trim())
      : Boolean(cryoCC.trim() && cryoC.trim());

  function handleApply() {
    setError('');
    if (!isComplete) {
      setError('Please provide at least Cryocan (CC-) and Canister (C-).');
      return;
    }

    const finalLoc = generatedCoordinate;

    // SMART rule: Max 5 straws per unique location
    const matchedCount = existingLocations.filter(
      (l) => l.trim().toUpperCase() === finalLoc && l.trim().toUpperCase() !== initialLocation.trim().toUpperCase()
    ).length;

    if (matchedCount >= 5) {
      setError(`Location ${finalLoc} can not be used more than 5`);
      return;
    }

    onApply(finalLoc);
    onClose();
  }

  function handleClear() {
    onApply('');
    onClose();
  }

  const activeColorItem = CRYO_PALETTE.find((c) => {
    let currentCode = '';
    if (locType === 'Straw') {
      if (activeColorField === 'GO') currentCode = strawGO;
      if (activeColorField === 'VE') currentCode = strawVE;
      if (activeColorField === 'VI') currentCode = strawVI;
      if (activeColorField === 'ST') currentCode = strawST;
    } else {
      currentCode = cryoColor;
    }
    return c.code === currentCode;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle ? (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">
                Breakdown LN2 cryostorage coordinates matching SMART IVF format
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-700">
            ⚠ {error}
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* Straw vs Cryovial toggle */}
          <div className="flex items-center gap-6 rounded-xl bg-slate-50 px-3.5 py-2 border border-slate-200/80">
            <span className="text-xs font-bold text-slate-700">Cryopreservation Type:</span>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="locType"
                value="Straw"
                checked={locType === 'Straw'}
                onChange={() => setLocType('Straw')}
                className="text-purple-600 focus:ring-purple-500"
              />
              Straw (Vitrification)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="radio"
                name="locType"
                value="Cryovial"
                checked={locType === 'Cryovial'}
                onChange={() => setLocType('Cryovial')}
                className="text-purple-600 focus:ring-purple-500"
              />
              Cryovial
            </label>
          </div>

          {/* Coordinate Inputs */}
          {locType === 'Straw' ? (
            <div className="grid grid-cols-3 gap-2.5 text-xs sm:grid-cols-6">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-600">Cryocan</span>
                <div className="mt-1 flex items-center">
                  <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">
                    CC-
                  </span>
                  <input
                    value={strawECC}
                    onChange={(e) => setStrawECC(e.target.value.toUpperCase())}
                    placeholder="BA52"
                    className="h-9 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-600">Canister</span>
                <div className="mt-1 flex items-center">
                  <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">
                    C-
                  </span>
                  <input
                    value={strawEC}
                    onChange={(e) => setStrawEC(e.target.value.toUpperCase())}
                    placeholder="9"
                    className="h-9 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-600">Goblet</span>
                <div className="mt-1 flex items-center">
                  <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">
                    GO-
                  </span>
                  <input
                    value={strawGO}
                    onFocus={() => setActiveColorField('GO')}
                    onChange={(e) => setStrawGO(e.target.value.toUpperCase())}
                    placeholder="BL"
                    style={getColorStyle(strawGO)}
                    className={`h-9 w-full rounded-r-lg border px-1 text-center font-bold text-xs uppercase cursor-pointer ${
                      activeColorField === 'GO' ? 'border-purple-600 ring-2 ring-purple-200' : 'border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-600">Vesitube</span>
                <div className="mt-1 flex items-center">
                  <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">
                    VE-
                  </span>
                  <input
                    value={strawVE}
                    onFocus={() => setActiveColorField('VE')}
                    onChange={(e) => setStrawVE(e.target.value.toUpperCase())}
                    placeholder="PK"
                    style={getColorStyle(strawVE)}
                    className={`h-9 w-full rounded-r-lg border px-1 text-center font-bold text-xs uppercase cursor-pointer ${
                      activeColorField === 'VE' ? 'border-purple-600 ring-2 ring-purple-200' : 'border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-600">Visotube</span>
                <div className="mt-1 flex items-center">
                  <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">
                    VI-
                  </span>
                  <input
                    value={strawVI}
                    onFocus={() => setActiveColorField('VI')}
                    onChange={(e) => setStrawVI(e.target.value.toUpperCase())}
                    placeholder="WT"
                    style={getColorStyle(strawVI)}
                    className={`h-9 w-full rounded-r-lg border px-1 text-center font-bold text-xs uppercase cursor-pointer ${
                      activeColorField === 'VI' ? 'border-purple-600 ring-2 ring-purple-200' : 'border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-600">Straw</span>
                <div className="mt-1 flex items-center">
                  <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">
                    ST-
                  </span>
                  <input
                    value={strawST}
                    onFocus={() => setActiveColorField('ST')}
                    onChange={(e) => setStrawST(e.target.value.toUpperCase())}
                    placeholder="RD"
                    style={getColorStyle(strawST)}
                    className={`h-9 w-full rounded-r-lg border px-1 text-center font-bold text-xs uppercase cursor-pointer ${
                      activeColorField === 'ST' ? 'border-purple-600 ring-2 ring-purple-200' : 'border-slate-300'
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-5">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-600">Cryocan</span>
                <div className="mt-1 flex items-center">
                  <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">
                    CC-
                  </span>
                  <input
                    value={cryoCC}
                    onChange={(e) => setCryoCC(e.target.value.toUpperCase())}
                    placeholder="BA57"
                    className="h-9 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-600">Canister</span>
                <div className="mt-1 flex items-center">
                  <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">
                    C-
                  </span>
                  <input
                    value={cryoC}
                    onChange={(e) => setCryoC(e.target.value.toUpperCase())}
                    placeholder="7"
                    className="h-9 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-600">Holder</span>
                <div className="mt-1 flex items-center">
                  <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">
                    CH-
                  </span>
                  <input
                    value={cryoCH}
                    onChange={(e) => setCryoCH(e.target.value.toUpperCase())}
                    placeholder="R"
                    className="h-9 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-600">Cryovial</span>
                <div className="mt-1 flex items-center">
                  <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">
                    CV-
                  </span>
                  <input
                    value={cryoCV}
                    onChange={(e) => setCryoCV(e.target.value.toUpperCase())}
                    placeholder="L1"
                    className="h-9 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-600">Vial Color</span>
                <input
                  value={cryoColor}
                  onFocus={() => setActiveColorField('CV_COLOR')}
                  onChange={(e) => setCryoColor(e.target.value.toUpperCase())}
                  placeholder="BL"
                  style={getColorStyle(cryoColor)}
                  className={`mt-1 h-9 w-full rounded-lg border px-1 text-center font-bold text-xs uppercase cursor-pointer ${
                    activeColorField === 'CV_COLOR' ? 'border-purple-600 ring-2 ring-purple-200' : 'border-slate-300'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Color Palette Picker */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 uppercase tracking-wide">
                  Color Picker for {activeColorField}:
                </span>
                {activeColorItem && (
                  <span
                    style={{ backgroundColor: activeColorItem.bg, color: activeColorItem.fg }}
                    className="rounded-md px-2 py-0.5 text-[10px] font-bold border border-slate-300 shadow-2xs"
                  >
                    {activeColorItem.name}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                Click color below to assign to {activeColorField}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
              {CRYO_PALETTE.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelectColor(c.code)}
                  style={{ backgroundColor: c.bg, color: c.fg }}
                  className="rounded-lg border border-slate-300/80 px-2 py-1.5 text-[11px] font-black uppercase shadow-2xs transition hover:scale-105 active:scale-95 text-center"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-900">SMART Coordinate Output:</span>
              <span className="text-[11px] text-purple-600">Max 5 straws per location</span>
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-purple-950 break-all select-all bg-white px-2.5 py-1.5 rounded-lg border border-purple-200/80">
              {generatedCoordinate}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-red-200 bg-red-50/60 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
          >
            Clear Location
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-xl bg-purple-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800 transition"
            >
              Apply Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
