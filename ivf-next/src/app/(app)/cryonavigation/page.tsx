'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePatient } from '@/contexts/patient-context';
import {
  fetchCryoInventory,
  validateCryoScanApi,
  type CryoMatchRow,
  type CryoScanValidationResult,
} from '@/lib/services/cryonavigation';
import Link from 'next/link';

interface ScanHistoryItem {
  id: string;
  time: string;
  scannedCode: string;
  status: 'OK' | 'MISMATCH' | 'SELECT';
  message: string;
  patientName?: string;
  location?: string;
}

export default function CryonavigationPage() {
  const { token } = useAuth();
  const { selectedPatient } = usePatient();

  const [activeTab, setActiveTab] = useState<'scanner' | 'inventory'>('scanner');
  const [scannedInput, setScannedInput] = useState('');
  const [enforceActivePatient, setEnforceActivePatient] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CryoScanValidationResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  // Inventory state
  const [inventory, setInventory] = useState<CryoMatchRow[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the barcode scanner input
  useEffect(() => {
    if (activeTab === 'scanner') {
      scanInputRef.current?.focus();
    }
  }, [activeTab, lastResult]);

  // Load inventory when switching to inventory tab
  useEffect(() => {
    if (activeTab === 'inventory' && token) {
      loadInventory();
    }
  }, [activeTab, token]);

  async function loadInventory() {
    if (!token) return;
    setInventoryLoading(true);
    try {
      const rows = await fetchCryoInventory(token);
      setInventory(rows);
    } catch {
      // fallback
    } finally {
      setInventoryLoading(false);
    }
  }

  // Audio tone feedback via Web Audio API
  function playAudioTone(ok: boolean) {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = ok ? 'sine' : 'sawtooth';
      osc.frequency.value = ok ? 880 : 220; // 880Hz high chime or 220Hz low buzz
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (ok ? 0.22 : 0.45));
      osc.start();
      osc.stop(ctx.currentTime + (ok ? 0.25 : 0.5));
    } catch {
      // ignore audio errors
    }
  }

  async function handleScanSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    const raw = scannedInput.trim();
    if (!raw || !token) return;

    setLoading(true);
    try {
      const expectedPatId = enforceActivePatient && selectedPatient?.id ? selectedPatient.id : undefined;
      const res = await validateCryoScanApi(token, raw, expectedPatId);
      setLastResult(res);

      const isOk = res.status === 'OK' || res.status === 'SELECT';
      playAudioTone(isOk);

      const verified = res.verifiedMatch || res.matches[0];
      setScanHistory((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          scannedCode: raw,
          status: res.status,
          message: res.message,
          patientName: verified?.patName,
          location: verified?.location,
        },
        ...prev.slice(0, 19),
      ]);

      setScannedInput('');
    } catch (err) {
      playAudioTone(false);
      const fallbackMsg = err instanceof Error ? err.message : 'Scan validation failed.';
      setLastResult({
        ok: false,
        status: 'MISMATCH',
        message: fallbackMsg,
        scannedCode: raw,
        matches: [],
      });
    } finally {
      setLoading(false);
      setTimeout(() => scanInputRef.current?.focus(), 50);
    }
  }

  function handleSelectCandidate(match: CryoMatchRow) {
    if (!lastResult) return;
    playAudioTone(true);
    setLastResult({
      ...lastResult,
      status: 'OK',
      message: `Selected match confirmed: ${match.patName} · ${match.cycleType} (${match.cycId}) · Location: ${match.location}`,
      verifiedMatch: match,
    });
    scanInputRef.current?.focus();
  }

  const filteredInventory = inventory.filter((item) => {
    const q = searchFilter.toLowerCase();
    const matchQ =
      !q ||
      item.patName.toLowerCase().includes(q) ||
      item.cycId.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.compactBarcode.toLowerCase().includes(q);

    if (!matchQ) return false;
    if (typeFilter === 'ALL') return true;
    if (typeFilter === 'OOCYTE') return item.cycleType.toLowerCase().includes('oocyte');
    if (typeFilter === 'EMBRYO') return item.cycleType.toLowerCase().includes('embryo') || item.cycleType.toLowerCase().includes('fet');
    if (typeFilter === 'SEMEN') return item.cycleType.toLowerCase().includes('semen');
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-xl text-[#6345A6]">
              🧭
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Cryonavigation</h1>
              <p className="text-sm text-slate-500">
                QR &amp; Barcode Cryo Witnessing, Validation &amp; Canister Locator
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'scanner'
                ? 'bg-[#6345A6] text-white shadow-xs'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🔍 Scan &amp; Witness
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'inventory'
                ? 'bg-[#6345A6] text-white shadow-xs'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            📋 Cryo Storage Locator
          </button>
          <Link
            href="/label-printing"
            className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-[#6345A6] hover:bg-purple-100 transition shadow-2xs"
          >
            🏷️ Print QR Labels
          </Link>
        </div>
      </div>

      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Scanner Box */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Barcode / QR Scanner Input</h2>
                  <p className="text-xs text-slate-500">
                    Keyboard-wedge barcode scanner, QR reader, or manual keyboard entry.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="rounded text-[#6345A6] focus:ring-[#6345A6]"
                    />
                    <span>🔊 Audio Alerts</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enforceActivePatient}
                      onChange={(e) => setEnforceActivePatient(e.target.checked)}
                      className="rounded text-[#6345A6] focus:ring-[#6345A6]"
                    />
                    <span>🔒 Match Active Patient</span>
                  </label>
                </div>
              </div>

              {/* Active patient banner */}
              {selectedPatient ? (
                <div className="flex items-center justify-between rounded-xl bg-purple-50/80 border border-purple-100 px-4 py-2.5 text-xs text-slate-700">
                  <div>
                    <span className="font-semibold text-[#6345A6]">Active Patient Context:</span>{' '}
                    <strong>{selectedPatient.name}</strong> (ID: {selectedPatient.id})
                  </div>
                  {enforceActivePatient && (
                    <span className="rounded-md bg-purple-200/70 px-2 py-0.5 text-[10px] font-bold text-[#6345A6]">
                      Enforcing Patient Match
                    </span>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-800">
                  ⚠️ No active patient selected. Scanning will match any sample in the cryo inventory.
                </div>
              )}

              {/* Scanner Form */}
              <form onSubmit={handleScanSubmit} className="flex gap-2">
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scannedInput}
                  onChange={(e) => setScannedInput(e.target.value)}
                  placeholder="Focus here & scan barcode / QR code..."
                  autoComplete="off"
                  className="h-12 flex-1 rounded-xl border-2 border-[#6345A6] px-4 font-mono text-base tracking-wider text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-purple-100"
                />
                <button
                  type="submit"
                  disabled={loading || !scannedInput.trim()}
                  className="h-12 rounded-xl bg-[#6345A6] px-6 text-sm font-bold text-white transition hover:bg-[#52378c] disabled:opacity-50"
                >
                  {loading ? 'Validating…' : 'Validate'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScannedInput('');
                    setLastResult(null);
                    scanInputRef.current?.focus();
                  }}
                  className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </button>
              </form>

              {/* Status Display Card */}
              {lastResult ? (
                <div
                  className={`rounded-2xl border-2 p-6 transition-all ${
                    lastResult.status === 'OK'
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : lastResult.status === 'SELECT'
                      ? 'border-amber-400 bg-amber-50/50'
                      : 'border-rose-500 bg-rose-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-3xl font-black tracking-wide ${
                        lastResult.status === 'OK'
                          ? 'text-emerald-700'
                          : lastResult.status === 'SELECT'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {lastResult.status === 'OK' && '✅ OK (VALIDATED)'}
                      {lastResult.status === 'SELECT' && '⚠️ CANDIDATE SELECTION'}
                      {lastResult.status === 'MISMATCH' && '🛑 MISMATCH / NOT FOUND'}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800 mb-3">{lastResult.message}</p>

                  <div className="rounded-lg bg-white/80 p-3 border border-slate-200/60 font-mono text-xs text-slate-600 space-y-1">
                    <div>
                      <span className="font-sans font-bold text-slate-500">Scanned Payload:</span>{' '}
                      <code className="text-[#6345A6] font-bold">{lastResult.scannedCode}</code>
                    </div>
                  </div>

                  {/* Verified Details */}
                  {lastResult.verifiedMatch && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4 shadow-2xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                        Specimen Verification Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                        <div>
                          <div className="text-slate-500">Patient Name</div>
                          <div className="font-bold text-slate-900">{lastResult.verifiedMatch.patName}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Patient ID</div>
                          <div className="font-bold text-slate-900">ID #{lastResult.verifiedMatch.patId}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Cycle / Ref</div>
                          <div className="font-bold text-slate-900">
                            {lastResult.verifiedMatch.cycleType} ({lastResult.verifiedMatch.cycId})
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Specimen Code</div>
                          <div className="font-bold text-slate-900">{lastResult.verifiedMatch.itemTypeCode}</div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="text-slate-500 text-xs">Cryo Storage Location</div>
                        <div className="font-mono text-sm font-bold text-[#6345A6]">
                          {lastResult.verifiedMatch.location}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multi-Match Candidate Selection */}
                  {lastResult.status === 'SELECT' && lastResult.matches.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-bold text-amber-800">
                        Select one matching straw/vial to confirm witness:
                      </p>
                      <div className="space-y-2">
                        {lastResult.matches.map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectCandidate(m)}
                            className="flex items-center justify-between rounded-xl border border-amber-200 bg-white p-3 hover:bg-amber-100/40 cursor-pointer transition"
                          >
                            <div className="text-xs">
                              <strong>{m.patName}</strong> (PatID #{m.patId}) · {m.cycleType} ({m.cycId})
                              <div className="font-mono text-slate-500">{m.location}</div>
                            </div>
                            <button
                              type="button"
                              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-700"
                            >
                              Confirm
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                  <span className="text-4xl mb-2 animate-pulse">📷</span>
                  <h3 className="text-base font-bold text-slate-700">Scanner Ready</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Point your handheld 2D / QR barcode scanner at the printed specimen straw, vial, or petri dish.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Scan History */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>⏱️</span>
                <span>Session Scan Log</span>
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {scanHistory.length}
              </span>
            </div>

            {scanHistory.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No scans logged this session.</p>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {scanHistory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          item.status === 'OK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'SELECT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.time}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 truncate">{item.scannedCode}</div>
                    {item.patientName && (
                      <div className="text-[11px] text-slate-600">
                        {item.patientName} {item.location ? `· ${item.location}` : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">Cryo Storage Inventory &amp; QR Locator</h2>
              <p className="text-xs text-slate-500">
                Search and navigate all frozen straws, goblets, and vials across tanks.
              </p>
            </div>
            <button
              type="button"
              onClick={loadInventory}
              disabled={inventoryLoading}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by patient, cycle, location, or barcode..."
              className="h-9 w-72 rounded-lg border border-slate-300 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#6345A6]"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#6345A6]"
            >
              <option value="ALL">All Specimens</option>
              <option value="OOCYTE">Oocytes</option>
              <option value="EMBRYO">Embryos</option>
              <option value="SEMEN">Semen</option>
            </select>
          </div>

          {/* Inventory Table */}
          {inventoryLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading cryo inventory…</p>
          ) : filteredInventory.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No cryo specimens found matching criteria.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5">Patient Name</th>
                    <th className="px-3 py-2.5">Cycle Ref</th>
                    <th className="px-3 py-2.5">Specimen Type</th>
                    <th className="px-3 py-2.5">Cryo Storage Location</th>
                    <th className="px-3 py-2.5">Compact QR Barcode</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {item.patName} <span className="text-[10px] text-slate-400">(#{item.patId})</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600">{item.cycId}</td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {item.cycleType}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[#6345A6] font-bold">{item.location}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{item.compactBarcode}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            item.isPrinted ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.printable}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setScannedInput(item.compactBarcode);
                            setActiveTab('scanner');
                          }}
                          className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-[#6345A6] hover:bg-purple-100 shadow-2xs"
                        >
                          Test Scan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
