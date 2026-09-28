'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { usePatient } from '@/contexts/patient-context';
import { PatientContextBar } from '@/components/patient-context-bar';
import { PatientSelectModal } from '@/components/patient-select-modal';
import {
  MEDIA_CATEGORIES,
  getCategoryName,
  getCategoryBadgeClass,
  MediaItem,
  MediaCycleOption,
  LibraryItem,
  MediaPrintData,
} from '@/lib/types/media';
import {
  fetchMediaCycles,
  fetchMediaList,
  saveMedia,
  deleteMedia,
  toggleMediaSelect,
  fetchLibraryFiles,
  uploadToLibrary,
  deleteFromLibrary,
  fetchPrintReportData,
} from '@/lib/services/media';

export function MediaManagementClient() {
  const { token, user } = useAuth();
  const { selectedPatient, selectedSatellite } = usePatient();

  // State
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [cycles, setCycles] = useState<MediaCycleOption[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [loadingCycles, setLoadingCycles] = useState(false);

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [filterCategory, setFilterCategory] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null);
  const [formFileName, setFormFileName] = useState('');
  const [formCatId, setFormCatId] = useState<number>(1);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedLibraryFile, setSelectedLibraryFile] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Library Modal State
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState<LibraryItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [uploadingToLib, setUploadingToLib] = useState(false);
  const libFileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox / Image Viewer State
  const [lightboxItem, setLightboxItem] = useState<MediaItem | LibraryItem | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);

  // Print Report State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printReportData, setPrintReportData] = useState<MediaPrintData | null>(null);
  const [loadingPrint, setLoadingPrint] = useState(false);

  // Toast / Alert state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const patId = selectedPatient?.id || 0;
  const satId = selectedPatient?.satelliteId || selectedSatellite?.id || 0;

  // 1. Load cycles when patient changes
  useEffect(() => {
    if (!token || !patId) {
      setCycles([]);
      setSelectedCycleId('');
      setMediaList([]);
      setSelectedCount(0);
      return;
    }

    setLoadingCycles(true);
    fetchMediaCycles(token, patId, satId)
      .then((data) => {
        setCycles(data);
        if (data.length > 0) {
          // Select first cycle by default
          setSelectedCycleId(data[0].cycId);
        } else {
          setSelectedCycleId('');
        }
      })
      .catch((err) => {
        showToast(err.message, 'error');
      })
      .finally(() => setLoadingCycles(false));
  }, [token, patId, satId]);

  // 2. Load media list when selectedCycleId or filterCategory changes
  const loadMedia = React.useCallback(async () => {
    if (!token || !patId || !selectedCycleId) {
      setMediaList([]);
      setSelectedCount(0);
      return;
    }

    setLoadingMedia(true);
    try {
      const res = await fetchMediaList(token, selectedCycleId, patId, satId, filterCategory);
      setMediaList(res.items);
      setSelectedCount(res.selectedCount);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoadingMedia(false);
    }
  }, [token, patId, satId, selectedCycleId, filterCategory]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Reset Form
  const resetForm = () => {
    setEditingMediaId(null);
    setFormFileName('');
    setFormCatId(1);
    setFormDate(new Date().toISOString().split('T')[0]);
    setSelectedLibraryFile('');
    setUploadedFile(null);
    if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) {
      showToast('Only image files (jpg, jpeg, png, gif, webp, bmp) are supported.', 'error');
      return;
    }

    setUploadedFile(file);
    setSelectedLibraryFile('');
    const preview = URL.createObjectURL(file);
    setFilePreviewUrl(preview);

    if (!formFileName.trim()) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setFormFileName(nameWithoutExt);
    }
  };

  // Select item to edit
  const handleEditItem = (item: MediaItem) => {
    setEditingMediaId(item.mediaId);
    setFormFileName(item.fileName);
    setFormCatId(item.catId);
    if (item.dateOfCreation) {
      try {
        const d = new Date(item.dateOfCreation);
        if (!isNaN(d.getTime())) {
          setFormDate(d.toISOString().split('T')[0]);
        }
      } catch {
        /* ignore */
      }
    }
    setSelectedLibraryFile(item.mediaFile);
    setUploadedFile(null);
    setFilePreviewUrl(item.url);

    // Scroll smoothly to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Media Form
  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!patId) {
      showToast('Please select a patient first.', 'error');
      return;
    }

    if (!selectedCycleId) {
      showToast('Please select a cycle first.', 'error');
      return;
    }

    if (!formFileName.trim()) {
      showToast('File Name is required.', 'error');
      return;
    }

    if (!uploadedFile && !selectedLibraryFile) {
      showToast('Please upload an image file or choose one from the Shared Library.', 'error');
      return;
    }

    setSavingForm(true);
    try {
      const formData = new FormData();
      if (editingMediaId) {
        formData.append('mediaId', String(editingMediaId));
      }
      formData.append('cycId', selectedCycleId);
      formData.append('patId', String(patId));
      formData.append('satId', String(satId));
      formData.append('fileName', formFileName.trim());
      formData.append('catId', String(formCatId));
      formData.append('dateOfCreation', formDate);

      if (uploadedFile) {
        formData.append('file', uploadedFile);
      } else if (selectedLibraryFile) {
        formData.append('mediaFile', selectedLibraryFile);
      }

      const res = await saveMedia(token, formData);
      showToast(res.message, 'success');
      resetForm();
      await loadMedia();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingForm(false);
    }
  };

  // Delete Media
  const handleDeleteMedia = async (item: MediaItem) => {
    if (!token) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${item.fileName}"?\nThis will remove the media entry from cycle ${item.cycId}.`
    );
    if (!confirmDelete) return;

    try {
      await deleteMedia(token, item.mediaId, item.cycId, item.patId, item.satId);
      showToast('Media file deleted successfully.', 'success');
      if (editingMediaId === item.mediaId) {
        resetForm();
      }
      await loadMedia();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  // Toggle "Select for report"
  const handleToggleSelect = async (item: MediaItem, checked: boolean) => {
    if (!token) return;

    // Optimistic UI update
    setMediaList((prev) =>
      prev.map((m) => (m.mediaId === item.mediaId ? { ...m, mediaSelected: checked } : m))
    );
    setSelectedCount((prev) => (checked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleMediaSelect(token, item.mediaId, item.patId, item.satId, checked);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
      // Revert on failure
      loadMedia();
    }
  };

  // Open Shared Library
  const handleOpenLibrary = async () => {
    if (!token) return;
    setLibraryModalOpen(true);
    setLoadingLibrary(true);
    try {
      const items = await fetchLibraryFiles(token);
      setLibraryFiles(items);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoadingLibrary(false);
    }
  };

  // Upload to Shared Library
  const handleUploadToLib = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingToLib(true);
    try {
      await uploadToLibrary(token, file);
      showToast('Image uploaded to library successfully.', 'success');
      const items = await fetchLibraryFiles(token);
      setLibraryFiles(items);
      if (libFileInputRef.current) libFileInputRef.current.value = '';
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setUploadingToLib(false);
    }
  };

  // Delete from Shared Library
  const handleDeleteFromLibrary = async (file: LibraryItem) => {
    if (!token) return;

    let warning = `Delete "${file.fileName}" from the shared library?`;
    if (file.inUse) {
      warning += `\n\n⚠️ Warning: This image is currently linked to patient records. Deleting it will cause broken images on those records!`;
    }
    const confirmDelete = window.confirm(warning);
    if (!confirmDelete) return;

    try {
      await deleteFromLibrary(token, file.fileName);
      showToast('Image deleted from library.', 'success');
      if (selectedLibraryFile === file.fileName) {
        setSelectedLibraryFile('');
        setFilePreviewUrl(null);
      }
      const items = await fetchLibraryFiles(token);
      setLibraryFiles(items);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  // Choose item from library for the form
  const handleSelectLibFile = (file: LibraryItem) => {
    setSelectedLibraryFile(file.fileName);
    setUploadedFile(null);
    setFilePreviewUrl(file.url);
    if (!formFileName.trim()) {
      const base = file.fileName.substring(0, file.fileName.lastIndexOf('.')) || file.fileName;
      setFormFileName(base);
    }
    setLibraryModalOpen(false);
    showToast(`Selected "${file.fileName}" from library.`, 'info');
  };

  // Print Selected Pictures
  const handleOpenPrintModal = async () => {
    if (!token || !patId || !selectedCycleId) {
      showToast('Please select a cycle with pictures first.', 'error');
      return;
    }

    if (selectedCount === 0) {
      showToast('No printable pictures are selected. Mark "Select for report" on at least one image.', 'info');
      return;
    }

    setLoadingPrint(true);
    setPrintModalOpen(true);
    try {
      const data = await fetchPrintReportData(token, selectedCycleId, patId, satId);
      setPrintReportData(data);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
      setPrintModalOpen(false);
    } finally {
      setLoadingPrint(false);
    }
  };

  // Filtered Media items
  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      const matchesCategory = filterCategory === 0 || item.catId === filterCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.mediaFile.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.catName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [mediaList, filterCategory, searchQuery]);

  // Filtered Library files
  const filteredLibrary = useMemo(() => {
    return libraryFiles.filter((item) =>
      !librarySearch.trim() || item.fileName.toLowerCase().includes(librarySearch.toLowerCase())
    );
  }, [libraryFiles, librarySearch]);

  return (
    <div className="min-h-full pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300 border ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
              : 'bg-[#181d38] text-white border-white/20 shadow-black/20'
          }`}
        >
          <span className="text-sm font-semibold">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Patient Selection Modal */}
      <PatientSelectModal open={patientModalOpen} onClose={() => setPatientModalOpen(false)} />

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-5 space-y-6">
        {/* Top Header & Patient Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600">
                <span className="flex h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                Clinical Lab Modules
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 mt-0.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                Media Module
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Capture, categorize, and report clinical cycle images, embryology pictures, and lab documentation.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenLibrary}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-700 transition"
              >
                <svg className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                  <line x1="17" y1="7" x2="22" y2="7" />
                </svg>
                Shared Media Library
              </button>
            </div>
          </div>

          {/* Patient Context Bar */}
          <PatientContextBar
            patient={
              selectedPatient
                ? {
                    name: selectedPatient.name,
                    uhid: selectedPatient.uhid,
                    partner: selectedPatient.partner,
                    age: selectedPatient.age,
                    gender: selectedPatient.gender || 'Female',
                  }
                : null
            }
            onSelectPatient={() => setPatientModalOpen(true)}
          />
        </div>

        {/* If no patient is selected */}
        {!selectedPatient ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-3">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800">No Patient Selected</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Please choose a patient and cycle from the context bar above to manage and view patient media.
            </p>
            <button
              type="button"
              onClick={() => setPatientModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/25 hover:from-purple-700 hover:to-indigo-700 transition"
            >
              Choose Patient
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cycle Selection & Upload Form Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Cycle Media Entry
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a cycle and upload or associate microscopy and procedure images.
                  </p>
                </div>

                {/* Cycle Selector */}
                <div className="flex items-center gap-2.5">
                  <label htmlFor="cycleSelect" className="text-xs font-bold text-slate-600">
                    Cycle ID:
                  </label>
                  {loadingCycles ? (
                    <div className="h-9 w-44 animate-pulse rounded-xl bg-slate-100" />
                  ) : cycles.length === 0 ? (
                    <span className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200">
                      No cycles found
                    </span>
                  ) : (
                    <select
                      id="cycleSelect"
                      value={selectedCycleId}
                      onChange={(e) => {
                        setSelectedCycleId(e.target.value);
                        resetForm();
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
                    >
                      {cycles.map((c) => (
                        <option key={c.cycId} value={c.cycId}>
                          {c.displayLabel}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Upload Form (only active if a cycle is selected) */}
              {!selectedCycleId ? (
                <div className="p-6 text-center text-xs font-medium text-slate-500 bg-slate-50 rounded-2xl">
                  Please select a cycle above to upload and manage media.
                </div>
              ) : (
                <form onSubmit={handleSaveMedia} className="space-y-4">
                  {editingMediaId && (
                    <div className="flex items-center justify-between rounded-xl bg-purple-50 px-3.5 py-2 text-xs text-purple-900 border border-purple-200">
                      <span className="font-semibold">
                        Editing media record #{editingMediaId}
                      </span>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="font-bold underline text-purple-700 hover:text-purple-900"
                      >
                        Cancel Edit
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* File Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        File / Title Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formFileName}
                        onChange={(e) => setFormFileName(e.target.value)}
                        placeholder="e.g. Oocyte_Day1_GoodQuality"
                        required
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition"
                      />
                    </div>

                    {/* Category Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formCatId}
                        onChange={(e) => setFormCatId(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition"
                      >
                        {MEDIA_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Date of Creation <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition"
                      />
                    </div>
                  </div>

                  {/* File Source Box */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Image Source</div>
                        <div className="text-[11px] text-slate-500">
                          Upload a photo from your computer or pick an existing image from the Shared Library.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenLibrary}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        Browse Shared Library
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* File Input */}
                      <label className="flex flex-1 min-w-[240px] cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-3 hover:border-purple-400 hover:bg-purple-50/30 transition">
                        <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <div className="text-left">
                          <span className="text-xs font-bold text-purple-700">Choose File</span>
                          <span className="text-xs text-slate-500"> or drag here (JPG, PNG, GIF, BMP)</span>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>

                      {/* Selected File Indicator */}
                      {(filePreviewUrl || selectedLibraryFile) && (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2">
                          {filePreviewUrl ? (
                            <img
                              src={filePreviewUrl}
                              alt="Preview"
                              className="h-10 w-10 rounded-lg object-cover border border-emerald-300 shadow-xs"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                              IMG
                            </div>
                          )}
                          <div className="max-w-[200px]">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                              {uploadedFile ? 'Uploaded File' : 'Library File'}
                            </div>
                            <div className="truncate text-xs font-semibold text-slate-800">
                              {uploadedFile?.name || selectedLibraryFile}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFile(null);
                              setSelectedLibraryFile('');
                              setFilePreviewUrl(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="rounded-lg p-1 text-slate-400 hover:bg-emerald-200/50 hover:text-slate-700 transition"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Action Row */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    {editingMediaId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingForm}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50"
                    >
                      {savingForm ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Saving...
                        </>
                      ) : editingMediaId ? (
                        'Update Media'
                      ) : (
                        'Save Media'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Media Gallery / Grid Section */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              {/* Category Tabs & Filter Toolbar */}
              <div className="flex flex-col gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <svg className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                      Media Gallery ({filteredMedia.length})
                    </h3>
                  </div>

                  {/* Selected for report count & Print Button */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Selected for report: {selectedCount}
                    </span>

                    <button
                      type="button"
                      onClick={handleOpenPrintModal}
                      disabled={selectedCount === 0 || loadingPrint}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Prints or exports selected pictures for the cycle report"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                      </svg>
                      Print Selected Pictures
                    </button>
                  </div>
                </div>

                {/* Search & Category Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <div className="relative min-w-[180px]">
                    <input
                      type="text"
                      placeholder="Search pictures..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:bg-white focus:outline-none transition"
                    />
                    <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>

                  {/* Category Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    <button
                      type="button"
                      onClick={() => setFilterCategory(0)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        filterCategory === 0
                          ? 'bg-[#181d38] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({mediaList.length})
                    </button>

                    {MEDIA_CATEGORIES.map((cat) => {
                      const count = mediaList.filter((m) => m.catId === cat.id).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFilterCategory(cat.id)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                            filterCategory === cat.id
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat.name}
                          {count > 0 && (
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                                filterCategory === cat.id ? 'bg-purple-700 text-white' : 'bg-white text-slate-700'
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Gallery Grid */}
              {loadingMedia ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-8">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-3 h-56" />
                  ))}
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center bg-slate-50/50">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-2">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div className="text-sm font-bold text-slate-800">No media found</div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {mediaList.length === 0
                      ? 'No pictures have been uploaded for this cycle yet.'
                      : 'No media matches your filter criteria.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredMedia.map((item) => (
                    <div
                      key={item.mediaId}
                      className={`group relative flex flex-col justify-between rounded-2xl border bg-white overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 ${
                        item.mediaSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      {/* Top Overlay Badge / Delete Button */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(item)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-400 backdrop-blur-xs shadow-xs hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete media"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>

                      {/* Image Thumbnail with Lightbox click */}
                      <div
                        onClick={() => setLightboxItem(item)}
                        className="relative h-36 w-full cursor-zoom-in bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100"
                      >
                        <img
                          src={item.url}
                          alt={item.fileName}
                          className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.currentTarget as HTMLImageElement).src = '/images/placeholder-egg.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 rounded-full bg-black/60 text-white p-1.5 shadow-sm transition-opacity">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              <line x1="11" y1="8" x2="11" y2="14" />
                              <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                          </span>
                        </div>
                      </div>

                      {/* Card Content & Details */}
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${getCategoryBadgeClass(
                                item.catId
                              )}`}
                            >
                              {item.catName}
                            </span>
                            {item.dateOfCreation && (
                              <span className="text-[10px] text-slate-400 font-medium ml-auto">
                                {item.dateOfCreation}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleEditItem(item)}
                            className="text-left font-bold text-xs text-slate-800 hover:text-purple-600 line-clamp-1 transition"
                            title="Click to edit"
                          >
                            {item.fileName}
                          </button>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5" title={item.mediaFile}>
                            {item.mediaFile}
                          </div>
                        </div>

                        {/* "Select for report" Checkbox */}
                        <div className="pt-2 border-t border-slate-100">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.mediaSelected}
                              onChange={(e) => handleToggleSelect(item, e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition"
                            />
                            <span
                              className={`text-[11px] font-bold ${
                                item.mediaSelected ? 'text-emerald-700' : 'text-slate-500'
                              }`}
                            >
                              Select for report
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Shared Media Library Modal */}
      {libraryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/30">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Shared Media Library</h3>
                  <p className="text-xs text-slate-500">
                    Universal image assets repository shared across all cycles and patients.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLibraryModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Upload & Search Bar */}
            <div className="border-b border-slate-100 px-6 py-3.5 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              {/* Upload to Library */}
              <div className="flex items-center gap-2.5">
                <label className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:from-purple-700 hover:to-indigo-700 transition cursor-pointer">
                  {uploadingToLib ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload New Image
                    </>
                  )}
                  <input
                    ref={libFileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                    onChange={handleUploadToLib}
                    disabled={uploadingToLib}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Upload standard oocyte, embryo, or sperm morphology templates.
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter library files..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 focus:border-purple-600 focus:outline-none"
                />
                <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {/* Modal Body / Files Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingLibrary ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 py-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-2xl bg-slate-100 h-44" />
                  ))}
                </div>
              ) : filteredLibrary.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No images in the library matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredLibrary.map((file) => (
                    <div
                      key={file.fileName}
                      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs hover:border-purple-400 hover:shadow-md transition"
                    >
                      {/* Delete from library button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFromLibrary(file);
                        }}
                        className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-xs hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete from Library"
                      >
                        ✕
                      </button>

                      {/* Image Thumbnail */}
                      <div
                        onClick={() => handleSelectLibFile(file)}
                        className="h-28 w-full cursor-pointer rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:scale-102 transition"
                      >
                        <img
                          src={file.url}
                          alt={file.fileName}
                          className="h-full w-full object-contain p-1"
                        />
                      </div>

                      {/* Info & Select Button */}
                      <div className="mt-2 text-center">
                        <div className="truncate text-xs font-bold text-slate-800" title={file.fileName}>
                          {file.fileName}
                        </div>
                        <div className="flex items-center justify-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                          {file.inUse && (
                            <span className="rounded-md bg-blue-50 px-1 text-[9px] font-bold text-blue-700">
                              In Use
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectLibFile(file)}
                          className="mt-2 w-full rounded-lg bg-purple-50 py-1 text-xs font-bold text-purple-700 hover:bg-purple-600 hover:text-white transition"
                        >
                          Select Image
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total {libraryFiles.length} images available
              </span>
              <button
                type="button"
                onClick={() => setLibraryModalOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / High-Res Image Previewer */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          {/* Lightbox Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            <button
              type="button"
              onClick={() => setLightboxZoom((z) => Math.min(3, z + 0.25))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs transition"
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setLightboxZoom((z) => Math.max(0.5, z - 0.25))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs transition"
              title="Zoom Out"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setLightboxRotation((r) => (r + 90) % 360)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs transition"
              title="Rotate 90deg"
            >
              ↻
            </button>
            <button
              type="button"
              onClick={() => {
                setLightboxItem(null);
                setLightboxZoom(1);
                setLightboxRotation(0);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 transition"
              title="Close Preview"
            >
              ✕
            </button>
          </div>

          <div className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center p-2">
            <img
              src={lightboxItem.url}
              alt={'fileName' in lightboxItem ? lightboxItem.fileName : 'Preview'}
              style={{
                transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                transition: 'transform 0.2s cubic-bezier(0.165, 0.84, 0.44, 1)',
              }}
              className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <div className="mt-4 text-center text-white">
              <div className="text-base font-bold">
                {'fileName' in lightboxItem ? lightboxItem.fileName : ''}
              </div>
              {'catName' in lightboxItem && (
                <div className="text-xs text-purple-300 mt-0.5">
                  Category: {lightboxItem.catName} | Date: {lightboxItem.dateOfCreation}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Action Header (hidden in window.print) */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50 print:hidden">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Embryos & Clinical Pictures Report
                </h3>
                <p className="text-xs text-slate-500">
                  Formatted patient cycle photo report matching SMART EmbryosPictures.rdlc.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print Report
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Report Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white print:p-0 print:overflow-visible">
              {loadingPrint || !printReportData ? (
                <div className="p-12 text-center text-slate-500">Generating report...</div>
              ) : (
                <div className="space-y-6 text-slate-900 font-sans print:space-y-4">
                  {/* Header Banner */}
                  <div className="border-b-2 border-purple-600 pb-4 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black text-purple-700 tracking-tight">
                        FERTITRACE IVF
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Clinical Embryology & Microscopy Report
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                      <div>Cycle ID: <strong>{printReportData.cycle.cycId}</strong></div>
                    </div>
                  </div>

                  {/* Patient Info Box */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Patient Name
                        </div>
                        <div className="font-bold text-slate-800 text-sm">
                          {printReportData.patient.patName}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          UHID
                        </div>
                        <div className="font-bold text-slate-800">
                          {printReportData.patient.uhid || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Husband / Partner
                        </div>
                        <div className="font-bold text-slate-800">
                          {printReportData.patient.husbandName || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Age / Satellite
                        </div>
                        <div className="font-bold text-slate-800">
                          {printReportData.patient.patAge ? `${printReportData.patient.patAge} Y` : '—'} /{' '}
                          {printReportData.patient.satName || 'Main Centre'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pictures Grid (2 Columns, high-fidelity printable pairs) */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 border-b border-purple-200 pb-1">
                      Selected Clinical Pictures ({printReportData.pictures.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-6 print:gap-4">
                      {printReportData.pictures.map((pic) => (
                        <div
                          key={pic.mediaId}
                          className="rounded-xl border border-slate-300 p-3 bg-white text-center break-inside-avoid shadow-2xs"
                        >
                          <div className="h-48 w-full flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 mb-2">
                            <img
                              src={pic.url}
                              alt={pic.fileName}
                              className="max-h-full max-w-full object-contain p-1"
                            />
                          </div>
                          <div className="font-bold text-xs text-slate-900">{pic.fileName}</div>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                              {pic.catName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {pic.dateOfCreation}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Report Signatures */}
                  <div className="pt-12 mt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-600 print:pt-8 print:mt-6">
                    <div>
                      <div className="h-10 border-b border-dashed border-slate-400 w-48 mx-auto" />
                      <div className="mt-2 font-bold text-slate-800">Embryologist Signature</div>
                      <div className="text-[10px] text-slate-400">IVF Laboratory Specialist</div>
                    </div>
                    <div>
                      <div className="h-10 border-b border-dashed border-slate-400 w-48 mx-auto" />
                      <div className="mt-2 font-bold text-slate-800">Consultant Gynaecologist</div>
                      <div className="text-[10px] text-slate-400">Clinical Director</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
