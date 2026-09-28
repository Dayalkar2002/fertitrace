export interface MediaCategory {
  id: number;
  name: string;
  badgeColor?: string;
}

export const MEDIA_CATEGORIES: MediaCategory[] = [
  { id: 1, name: 'Oocyte Retrival', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 2, name: 'Semen Sample', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 3, name: 'IVF Proc', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 4, name: 'ICSI Proc', badgeColor: 'bg-violet-50 text-violet-700 border-violet-200' },
  { id: 5, name: 'Fertilization', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 6, name: 'Embryos', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 7, name: 'Blastocysts', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 8, name: 'Laparoscopy', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 9, name: 'IUI', badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
];

export function getCategoryName(catId: number): string {
  const cat = MEDIA_CATEGORIES.find((c) => c.id === Number(catId));
  return cat ? cat.name : `Category ${catId}`;
}

export function getCategoryBadgeClass(catId: number): string {
  const cat = MEDIA_CATEGORIES.find((c) => c.id === Number(catId));
  return cat?.badgeColor || 'bg-slate-50 text-slate-700 border-slate-200';
}

export interface MediaItem {
  mediaId: number;
  cycId: string;
  patId: number;
  satId: number;
  dateOfCreation: string;
  fileName: string;
  catId: number;
  catName: string;
  mediaFile: string;
  mediaSelected: boolean;
  url: string;
}

export interface MediaCycleOption {
  cycId: string;
  cycDate: string;
  displayLabel: string;
}

export interface LibraryItem {
  fileName: string;
  url: string;
  size: number;
  updatedAt: string;
  inUse: boolean;
}

export interface MediaPrintData {
  patient: {
    patId: number;
    patName: string;
    uhid?: string;
    patAge?: number | null;
    patDob?: string;
    husbandName?: string;
    satName?: string;
  };
  cycle: {
    cycId: string;
    cycDate?: string;
  };
  pictures: Array<{
    mediaId: number;
    fileName: string;
    mediaFile: string;
    catId: number;
    catName: string;
    dateOfCreation: string;
    url: string;
  }>;
}
