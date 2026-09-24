import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { clinicProfile } from '@/lib/services-server/consent.service';

export interface ConsentCatalogForm {
  relativePath: string;
  displayName: string;
}

export interface ConsentCatalogCategory {
  title: string;
  letter: string;
  forms: ConsentCatalogForm[];
}

export interface ConsentCatalogPreset {
  id: string;
  title: string;
  paths: string[];
}

const PRESETS = [
  { id: '1', title: 'Self Oocytes + Husband Sample + Self ET + Embryo Freezing', art: '6,9,12,14B,18', icmr: 'I', pcpndt: 'D', misc: '' },
  { id: '2', title: 'Self Oocytes + Husband Sample + NO ET + Freeze All', art: '6,9,12,14B,18', icmr: 'I', pcpndt: 'D', misc: '' },
  { id: '3', title: 'Self Oocytes + Husband Sample + FET', art: '6,9,12,14B,18', icmr: 'I', pcpndt: 'D', misc: 'Thaw Sheet' },
  { id: '4', title: 'Self Oocyte Freezing', art: '6,10,12', icmr: 'I', pcpndt: 'D', misc: '' },
  { id: '5', title: 'Self Oocyte Thaw + Husband Sample + Self ET', art: '6', icmr: 'I', pcpndt: 'D', misc: 'Thaw Sheet' },
  { id: '6', title: 'Self Oocytes Thaw + Donor Sample + ET', art: '6,8', icmr: 'I', pcpndt: 'D', misc: 'Thaw Sheet' },
  { id: '7', title: 'Oocyte Donor', art: '12,13', icmr: 'I', pcpndt: 'D', misc: '' },
  { id: '8', title: 'Donor Oocyte Freezing', art: '6,10', icmr: 'I', pcpndt: 'D', misc: '' },
  { id: '9', title: 'Oocyte Recipient', art: '6,9,AFFIDAVIT', icmr: 'I', pcpndt: 'D', misc: '' },
  { id: '10', title: 'Donor Oocyte Thaw + Donor Sample + ET Recipient', art: '6,8', icmr: 'I', pcpndt: 'D', misc: 'Thaw Sheet' },
  { id: '11', title: 'Donor Oocyte Thaw + Husband Sample + ET Recipient', art: '6,8', icmr: 'I', pcpndt: 'D', misc: 'Thaw Sheet' },
];

export function consentFormsRoot() {
  return process.env.CONSENT_FORMS_ROOT || 'D:\\smart\\ConsentForms';
}

function isConsentFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.doc' || ext === '.docx' || ext === '.rtf';
}

function excluded(filePath: string) {
  const name = path.basename(filePath, path.extname(filePath));
  if (/\bForm\s*J\b/i.test(name) || /ICMR\s*Form\s*J/i.test(name)) return true;
  const compact = name.replace(/[\s_\-.()]+/g, '');
  return /BLASTOMERELOCATION|CONDITIONSOFREPORTING|IVFREPORTFORMAT|WARDREPORTFORMAT/i.test(compact);
}

function safeUnderRoot(relativePath: string) {
  const root = path.resolve(consentFormsRoot());
  const full = path.resolve(root, relativePath);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}

export function listConsentCatalog(moduleName: string): { categories: ConsentCatalogCategory[]; presets: ConsentCatalogPreset[] } {
  const moduleKey = moduleName.toUpperCase() === 'IUI' ? 'IUI' : 'IVF';
  const moduleRoot = path.join(consentFormsRoot(), moduleKey);
  const categories: ConsentCatalogCategory[] = [];
  if (!fs.existsSync(moduleRoot)) return { categories, presets: [] };

  const folders = fs.readdirSync(moduleRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  for (const folder of folders) {
    const dir = path.join(moduleRoot, folder);
    const forms = walkFiles(dir)
      .filter((file) => isConsentFile(file) && !excluded(file))
      .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))
      .map((file) => ({
        relativePath: path.relative(consentFormsRoot(), file).split(path.sep).join('/'),
        displayName: path.basename(file, path.extname(file)),
      }));
    if (forms.length === 0) continue;
    const letter = (folder.match(/^([A-Z])\b/i) || ['', folder.slice(0, 1)])[1].toUpperCase();
    categories.push({ title: folder, letter, forms });
  }

  const presets = moduleKey === 'IVF' ? PRESETS.map((preset) => ({
    id: preset.id,
    title: preset.title,
    paths: resolvePresetPaths(preset, categories),
  })) : [];

  return { categories, presets };
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function resolvePresetPaths(
  preset: (typeof PRESETS)[number],
  categories: ConsentCatalogCategory[]
) {
  const all = categories.flatMap((category) => category.forms);
  const art = categories.filter((category) => /ART ACT/i.test(category.title)).flatMap((category) => category.forms);
  const icmr = categories.filter((category) => /ICMR/i.test(category.title)).flatMap((category) => category.forms);
  const pcpndt = categories.filter((category) => /PCPNDT/i.test(category.title)).flatMap((category) => category.forms);
  const paths: string[] = [];
  const seen = new Set<string>();
  const add = (form?: ConsentCatalogForm) => {
    if (form && seen.add(form.relativePath)) paths.push(form.relativePath);
  };
  for (const token of split(preset.art)) add(matchToken(art.length ? art : all, token) || matchToken(all, token));
  for (const token of split(preset.icmr)) add(matchToken(icmr.length ? icmr : all, token) || matchToken(all, token));
  for (const token of split(preset.pcpndt)) add(matchToken(pcpndt.length ? pcpndt : all, token) || matchToken(all, token));
  if (/thaw/i.test(preset.misc)) {
    const wantOocyte = /oocyte thaw/i.test(preset.title);
    const wantEmbryo = /fet|embryo/i.test(preset.title);
    for (const form of all) {
      if (!/thaw/i.test(form.displayName)) continue;
      const oocyte = /oocyte|ooyte/i.test(form.displayName);
      const embryo = /embryo/i.test(form.displayName);
      if ((wantOocyte && oocyte) || (wantEmbryo && embryo) || (!wantOocyte && !wantEmbryo)) add(form);
    }
  }
  return paths;
}

function split(csv: string) {
  return csv.split(',').map((part) => part.trim()).filter(Boolean);
}

function matchToken(forms: ConsentCatalogForm[], token: string) {
  if (token.toUpperCase() === 'AFFIDAVIT') return forms.find((form) => /affidavit/i.test(form.displayName));
  if (/^[A-Za-z]$/.test(token)) {
    const letter = token.toUpperCase();
    return forms.find((form) => new RegExp(`\\bForm\\s*${letter}\\b`, 'i').test(form.displayName));
  }
  const numbered = token.match(/^(\d+)\s*([A-Za-z]?)$/);
  if (!numbered) return forms.find((form) => form.displayName.toLowerCase().includes(token.toLowerCase()));
  const num = numbered[1];
  const suffix = (numbered[2] || '').toUpperCase();
  const hits = forms.filter((form) => new RegExp(`Form\\s*${num}\\s*([A-Za-z]?)\\b`, 'i').test(form.displayName));
  if (suffix) return hits.find((form) => new RegExp(`Form\\s*${num}\\s*${suffix}\\b`, 'i').test(form.displayName));
  return hits.find((form) => new RegExp(`Form\\s*${num}\\b(?!\\s*[A-Za-z])`, 'i').test(form.displayName)) || hits[0];
}

export interface ConsentFillFields {
  patientName: string;
  partnerName: string;
  uhid: string;
  age: string;
  dob: string;
  femaleAadhar: string;
  maleAadhar: string;
  mobile: string;
  email: string;
  address: string;
  registrationNo: string;
  diagnosis: string;
  cycleNo: string;
  consentDate: string;
  referredBy: string;
}

export async function buildConsentBookFromWord(
  relativePaths: string[],
  fields: ConsentFillFields
): Promise<Buffer> {
  const soffice = findSoffice();
  if (!soffice) {
    throw new Error(
      'LibreOffice is not installed, so the Word forms cannot be converted to PDF. Install LibreOffice and set LIBREOFFICE_PATH if it is not in Program Files.'
    );
  }

  const sources = relativePaths
    .map((relativePath) => ({ relativePath, full: safeUnderRoot(relativePath) }))
    .filter((item): item is { relativePath: string; full: string } => Boolean(item.full && fs.existsSync(item.full) && isConsentFile(item.full)));
  if (sources.length === 0) throw new Error('None of the selected Word forms were found.');

  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'fertitrace-consent-'));
  try {
    const pdfs: string[] = [];
    for (let index = 0; index < sources.length; index += 1) {
      const source = sources[index];
      const ext = path.extname(source.full).toLowerCase();
      const filled = path.join(work, `form-${index}${ext === '.docx' ? '.docx' : ext}`);
      if (ext === '.docx' && !/miscellaneous/i.test(source.relativePath)) await fillDocx(source.full, filled, fields);
      else fs.copyFileSync(source.full, filled);
      const pdf = path.join(work, `form-${index}.pdf`);
      await convertWithLibreOffice(soffice, filled, pdf, work);
      pdfs.push(pdf);
    }
    return mergePdfs(pdfs);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

function findSoffice() {
  const candidates = [
    process.env.LIBREOFFICE_PATH || '',
    'C:\\Program Files\\LibreOffice\\program\\soffice.com',
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com',
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || '';
}

async function fillDocx(source: string, dest: string, fields: ConsentFillFields) {
  const zip = await JSZip.loadAsync(fs.readFileSync(source));
  const entry = zip.file('word/document.xml');
  if (!entry) {
    fs.copyFileSync(source, dest);
    return;
  }
  const xml = fillDocumentXml(await entry.async('string'), fields);
  zip.file('word/document.xml', xml);
  fs.writeFileSync(dest, await zip.generateAsync({ type: 'nodebuffer' }));
}

function fillDocumentXml(xml: string, fields: ConsentFillFields) {
  const clinic = clinicProfile();
  const rules: Array<[RegExp, string]> = [
    [/name of female|name of the patient|wife name|patient full name/i, fields.patientName],
    [/name of male|husband'?s?\/father|husband name|husband\/partner name/i, fields.partnerName],
    [/aadhaar card female|aadhar card female|patient aadhaar|patient aadhar/i, fields.femaleAadhar],
    [/aadhaar card male|aadhar card male|husband\/partner aadhaar|husband\/partner aadhar/i, fields.maleAadhar],
    [/residence address|patient address/i, fields.address],
    [/art registration/i, clinic.artRegNo],
    [/pcpndt registration/i, clinic.pcpndtRegNo],
    [/name and address of (the )?clinic|name and address of art clinic/i, `${clinic.name}, ${clinic.address}`],
    [/type of facility/i, clinic.facilityType],
    [/consultant 1 registration/i, clinic.consultant1Reg],
    [/consultant 2 registration/i, clinic.consultant2Reg],
    [/consultant address/i, clinic.consultantAddress],
    [/consultant 1/i, clinic.consultant1],
    [/consultant 2/i, clinic.consultant2],
    [/uhid|smart no|registration no/i, fields.uhid || fields.registrationNo],
    [/date of birth/i, fields.dob],
    [/mobile/i, fields.mobile],
    [/e-?mail/i, fields.email],
    [/diagnosis/i, fields.diagnosis],
    [/cycle (no|number|id)/i, fields.cycleNo],
    [/witness name/i, clinic.witnessName],
    [/witness address/i, clinic.witnessAddress],
    [/^age\b/i, fields.age],
    [/^dated\b|^date$/i, fields.consentDate],
  ];

  return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraph) => {
    const texts = [...paragraph.matchAll(/<w:t(\s[^>]*)?>([^<]*)<\/w:t>/g)];
    if (texts.length === 0) return paragraph;
    const plain = decodeXml(texts.map((match) => match[2]).join('')).replace(/\s+/g, ' ').trim();
    if (!plain || plain.length > 180) return paragraph;
    const rule = rules.find(([pattern]) => pattern.test(plain));
    if (!rule || !rule[1]) return paragraph;
    const label = plain.replace(/[.\u2026_\s]+$/g, '').replace(/:\s*$/, '').trim();
    const filled = `${label}: ${rule[1]}`;
    if (filled === plain) return paragraph;
    let used = false;
    return paragraph.replace(/<w:t(\s[^>]*)?>([^<]*)<\/w:t>/g, (node, attrs) => {
      if (used) return `<w:t${attrs || ''}></w:t>`;
      used = true;
      return `<w:t${attrs || ''}>${escapeXml(filled)}</w:t>`;
    });
  });
}

function decodeXml(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function convertWithLibreOffice(soffice: string, source: string, pdfPath: string, work: string) {
  const outDir = path.join(work, `out-${path.basename(source, path.extname(source))}`);
  fs.mkdirSync(outDir, { recursive: true });
  const profile = path.join(outDir, 'profile');
  fs.mkdirSync(profile, { recursive: true });
  const profileUri = `file:///${profile.replace(/\\/g, '/')}`;
  const args = [
    '--headless',
    '--nologo',
    '--nolockcheck',
    '--nodefault',
    '--nofirststartwizard',
    '--norestore',
    `-env:UserInstallation=${profileUri}`,
    '--convert-to',
    'pdf',
    '--outdir',
    outDir,
    source,
  ];
  return new Promise<void>((resolve, reject) => {
    const child = spawn(soffice, args, { cwd: work, windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      const produced = path.join(outDir, `${path.basename(source, path.extname(source))}.pdf`);
      if (code !== 0 || !fs.existsSync(produced)) {
        reject(new Error(stderr.trim() || 'LibreOffice could not convert the Word form.'));
        return;
      }
      fs.copyFileSync(produced, pdfPath);
      resolve();
    });
  });
}

async function mergePdfs(files: string[]) {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const source = await PDFDocument.load(fs.readFileSync(file));
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return Buffer.from(await merged.save());
}
