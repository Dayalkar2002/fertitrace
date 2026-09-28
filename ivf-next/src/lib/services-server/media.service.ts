import fs from 'fs';
import path from 'path';
import { isDbConfigured } from '@/lib/db/pool';
import { buildParams, executeDML, executeDRL, executeText } from '@/lib/db/spExecutor';
import { formatSmartDate, rowVal } from '@/lib/db/row';
import {
  MediaCategory,
  MEDIA_CATEGORIES,
  getCategoryName,
  MediaItem,
  MediaCycleOption,
  LibraryItem,
  MediaPrintData,
} from '@/lib/types/media';

const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

export function getPublicMediaPath(): string {
  const p = path.join(process.cwd(), 'public', 'media');
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
  return p;
}

export function getSmartMediaPath(): string | null {
  const p = 'D:\\smart\\Media';
  try {
    if (fs.existsSync(p)) {
      return p;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function getCyclesForMedia(patId: number, satId: number): Promise<MediaCycleOption[]> {
  if (!patId || !isDbConfigured()) return [];

  try {
    const res = await executeDRL<Record<string, unknown>>(
      'spCycleForMedia',
      buildParams('@PatID,@SatID,@QueryIndex', [patId, satId || 0, 1])
    );
    const rows = res.recordset || [];
    return rows
      .map((r) => {
        const cycId = String(rowVal(r, 'CycID', 'cycid')).trim();
        const dateRaw = r.CycODate || r.iuiodate || r.CycDate;
        const cycDate = formatSmartDate(dateRaw);
        return {
          cycId,
          cycDate,
          displayLabel: cycDate ? `${cycId} (${cycDate})` : cycId,
        };
      })
      .filter((c) => Boolean(c.cycId));
  } catch (err) {
    console.error('[MediaService] getCyclesForMedia error:', err);
    return [];
  }
}

export async function getMediaList(
  cycId: string,
  patId: number,
  satId: number,
  catId = 0
): Promise<{ items: MediaItem[]; selectedCount: number }> {
  if (!isDbConfigured() || !cycId) {
    return { items: [], selectedCount: 0 };
  }

  try {
    const queryIndex = catId > 0 ? 3 : 1;
    const res = await executeDRL<Record<string, unknown>>(
      'spMedia',
      buildParams(
        '@MediaID,@CycID,@PatID,@SatID,@MediaDateOfCreation,@MediaFileName,@MediaFileCatID,@MediaFile,@QueryIndex',
        [0, cycId, patId, satId || 0, new Date(), '', catId, '', queryIndex]
      )
    );

    const rows = res.recordset || [];
    const items: MediaItem[] = rows.map((r) => {
      const mediaId = Number(rowVal(r, 'MediaID', 'mediaid'));
      const fileCatId = Number(rowVal(r, 'MediaFileCatID', 'mediafilecatid'));
      const rawDate = r.MediaDateOfCreation || r.mediadateofcreation;
      const mediaFile = String(rowVal(r, 'MediaFile', 'mediafile')).trim();
      const isSelected = Boolean(r.MediaSelected);

      return {
        mediaId,
        cycId: String(rowVal(r, 'CycID', 'cycid')).trim(),
        patId: Number(rowVal(r, 'PatID', 'patid')),
        satId: Number(rowVal(r, 'SatID', 'satid')),
        dateOfCreation: formatSmartDate(rawDate),
        fileName: String(rowVal(r, 'MediaFileName', 'mediafilename')).trim(),
        catId: fileCatId,
        catName: getCategoryName(fileCatId),
        mediaFile,
        mediaSelected: isSelected,
        url: `/media/${encodeURIComponent(mediaFile)}`,
      };
    });

    const countRes = await executeText<Record<string, unknown>>(
      `SELECT COUNT(1) AS SelectedCount FROM Media WHERE CycID = @CycID AND PatID = @PatID AND SatID = @SatID AND MediaSelected = 1`,
      [
        { name: '@CycID', value: cycId },
        { name: '@PatID', value: patId },
        { name: '@SatID', value: satId || 0 },
      ]
    );

    const selectedCount = Number(countRes.recordset?.[0]?.SelectedCount || 0);

    return { items, selectedCount };
  } catch (err) {
    console.error('[MediaService] getMediaList error:', err);
    throw err;
  }
}

export async function getMediaById(
  mediaId: number,
  cycId: string,
  patId: number,
  satId: number
): Promise<MediaItem | null> {
  if (!isDbConfigured()) return null;

  const res = await executeDRL<Record<string, unknown>>(
    'spMedia',
    buildParams(
      '@MediaID,@CycID,@PatID,@SatID,@MediaDateOfCreation,@MediaFileName,@MediaFileCatID,@MediaFile,@QueryIndex',
      [mediaId, cycId, patId, satId || 0, new Date(), '', 0, '', 2]
    )
  );

  const row = res.recordset?.[0];
  if (!row) return null;

  const fileCatId = Number(rowVal(row, 'MediaFileCatID', 'mediafilecatid'));
  const mediaFile = String(rowVal(row, 'MediaFile', 'mediafile')).trim();

  return {
    mediaId: Number(rowVal(row, 'MediaID', 'mediaid')),
    cycId: String(rowVal(row, 'CycID', 'cycid')).trim(),
    patId: Number(rowVal(row, 'PatID', 'patid')),
    satId: Number(rowVal(row, 'SatID', 'satid')),
    dateOfCreation: formatSmartDate(row.MediaDateOfCreation),
    fileName: String(rowVal(row, 'MediaFileName', 'mediafilename')).trim(),
    catId: fileCatId,
    catName: getCategoryName(fileCatId),
    mediaFile,
    mediaSelected: Boolean(row.MediaSelected),
    url: `/media/${encodeURIComponent(mediaFile)}`,
  };
}

export async function saveMediaRecord(data: {
  mediaId?: number;
  cycId: string;
  patId: number;
  satId: number;
  dateOfCreation: string;
  fileName: string;
  catId: number;
  mediaFile: string;
}): Promise<void> {
  if (!isDbConfigured()) throw new Error('Database is not configured.');

  const isUpdate = Boolean(data.mediaId && data.mediaId > 0);
  const queryIndex = isUpdate ? 12 : 11;
  const dateObj = data.dateOfCreation ? new Date(data.dateOfCreation) : new Date();

  await executeDML(
    'spMedia',
    buildParams(
      '@MediaID,@CycID,@PatID,@SatID,@MediaDateOfCreation,@MediaFileName,@MediaFileCatID,@MediaFile,@QueryIndex',
      [
        data.mediaId || 0,
        data.cycId,
        data.patId,
        data.satId || 0,
        dateObj,
        data.fileName,
        data.catId,
        data.mediaFile,
        queryIndex,
      ]
    )
  );
}

export async function deleteMediaRecord(
  mediaId: number,
  cycId: string,
  patId: number,
  satId: number
): Promise<void> {
  if (!isDbConfigured()) throw new Error('Database is not configured.');

  await executeDML(
    'spMedia',
    buildParams(
      '@MediaID,@CycID,@PatID,@SatID,@MediaDateOfCreation,@MediaFileName,@MediaFileCatID,@MediaFile,@QueryIndex',
      [mediaId, cycId, patId, satId || 0, new Date(), '', 0, '', 13]
    )
  );
}

export async function toggleMediaSelected(
  mediaId: number,
  patId: number,
  satId: number,
  selected: boolean
): Promise<void> {
  if (!isDbConfigured()) throw new Error('Database is not configured.');

  await executeText(
    `UPDATE Media SET MediaSelected = @Selected WHERE MediaID = @MediaID AND PatID = @PatID AND SatID = @SatID`,
    [
      { name: '@Selected', value: selected ? 1 : 0 },
      { name: '@MediaID', value: mediaId },
      { name: '@PatID', value: patId },
      { name: '@SatID', value: satId || 0 },
    ]
  );
}

export async function getLibraryFiles(): Promise<LibraryItem[]> {
  const dirPath = getPublicMediaPath();
  const smartDir = getSmartMediaPath();

  // If there are files in SMART dir not in public dir, sync them
  if (smartDir) {
    try {
      const smartFiles = fs.readdirSync(smartDir);
      for (const file of smartFiles) {
        const dest = path.join(dirPath, file);
        if (!fs.existsSync(dest)) {
          const src = path.join(smartDir, file);
          if (fs.statSync(src).isFile()) {
            fs.copyFileSync(src, dest);
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  const files = fs.readdirSync(dirPath);
  const imageFiles = files.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ALLOWED_IMAGE_EXTS.includes(ext);
  });

  // Check which files are in use in Media table
  let usedFiles = new Set<string>();
  if (isDbConfigured()) {
    try {
      const res = await executeText<{ MediaFile: string }>('SELECT DISTINCT MediaFile FROM Media WHERE MediaFile IS NOT NULL');
      usedFiles = new Set((res.recordset || []).map((r) => r.MediaFile.toLowerCase()));
    } catch {
      /* ignore */
    }
  }

  const items: LibraryItem[] = imageFiles.map((fileName) => {
    const fullPath = path.join(dirPath, fileName);
    const stat = fs.statSync(fullPath);
    return {
      fileName,
      url: `/media/${encodeURIComponent(fileName)}`,
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
      inUse: usedFiles.has(fileName.toLowerCase()),
    };
  });

  return items.sort((a, b) => a.fileName.localeCompare(b.fileName));
}

export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string
): Promise<{ fileName: string; url: string }> {
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
    throw new Error('Only image files (jpg, jpeg, png, gif, webp, bmp) are allowed.');
  }

  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 40);

  const dirPath = getPublicMediaPath();
  let finalName = `${baseName}${ext}`;
  let destPath = path.join(dirPath, finalName);

  if (fs.existsSync(destPath)) {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    finalName = `${baseName}_${timestamp}${ext}`;
    destPath = path.join(dirPath, finalName);
  }

  await fs.promises.writeFile(destPath, buffer);

  // Mirror to SMART media folder if it exists
  const smartDir = getSmartMediaPath();
  if (smartDir) {
    try {
      const smartDest = path.join(smartDir, finalName);
      await fs.promises.writeFile(smartDest, buffer);
    } catch (e) {
      console.warn('[MediaService] Mirror to SMART folder failed:', e);
    }
  }

  return {
    fileName: finalName,
    url: `/media/${encodeURIComponent(finalName)}`,
  };
}

export async function deleteLibraryFile(fileName: string): Promise<boolean> {
  const safeName = path.basename(fileName);
  const dirPath = getPublicMediaPath();
  const filePath = path.join(dirPath, safeName);

  let deleted = false;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    deleted = true;
  }

  const smartDir = getSmartMediaPath();
  if (smartDir) {
    try {
      const smartFilePath = path.join(smartDir, safeName);
      if (fs.existsSync(smartFilePath)) {
        fs.unlinkSync(smartFilePath);
      }
    } catch {
      /* ignore */
    }
  }

  return deleted;
}

export async function getEmbryoPicturesReportData(
  cycId: string,
  patId: number,
  satId: number
): Promise<MediaPrintData> {
  if (!isDbConfigured()) throw new Error('Database is not configured.');

  // Fetch patient info
  const patRes = await executeText<Record<string, unknown>>(
    `SELECT PM.PatID, PM.PatName, PM.PatAge, PM.PatDob, PM.PatHusbName, SM.SatName
     FROM PatientMaster PM
     LEFT JOIN SatelliteMaster SM ON SM.SatID = PM.SatID
     WHERE PM.PatID = @PatID`,
    [{ name: '@PatID', value: patId }]
  );

  const patRow = patRes.recordset?.[0] || {};

  // Fetch selected pictures for this cycle
  const picRes = await executeText<Record<string, unknown>>(
    `SELECT MediaID, MediaDateOfCreation, MediaFileName, MediaFileCatID, MediaFile
     FROM Media
     WHERE CycID = @CycID AND PatID = @PatID AND SatID = @SatID AND MediaSelected = 1
     ORDER BY MediaFileCatID, MediaDateOfCreation, MediaID`,
    [
      { name: '@CycID', value: cycId },
      { name: '@PatID', value: patId },
      { name: '@SatID', value: satId || 0 },
    ]
  );

  const pictures = (picRes.recordset || []).map((r) => {
    const catId = Number(rowVal(r, 'MediaFileCatID', 'mediafilecatid'));
    const mediaFile = String(rowVal(r, 'MediaFile', 'mediafile')).trim();
    return {
      mediaId: Number(rowVal(r, 'MediaID', 'mediaid')),
      fileName: String(rowVal(r, 'MediaFileName', 'mediafilename')).trim(),
      mediaFile,
      catId,
      catName: getCategoryName(catId),
      dateOfCreation: formatSmartDate(r.MediaDateOfCreation),
      url: `/media/${encodeURIComponent(mediaFile)}`,
    };
  });

  return {
    patient: {
      patId,
      patName: String(patRow.PatName || 'Unknown Patient'),
      uhid: patRow.UHID ? String(patRow.UHID) : undefined,
      patAge: patRow.PatAge ? Number(patRow.PatAge) : null,
      patDob: patRow.PatDob ? formatSmartDate(patRow.PatDob) : undefined,
      husbandName: patRow.PatHusbName ? String(patRow.PatHusbName) : undefined,
      satName: patRow.SatName ? String(patRow.SatName) : undefined,
    },
    cycle: {
      cycId,
    },
    pictures,
  };
}
