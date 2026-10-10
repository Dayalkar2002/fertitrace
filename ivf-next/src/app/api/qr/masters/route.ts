import { NextRequest, NextResponse } from 'next/server';

export interface QRMasterItem {
  id: string;
  tableKey: string;
  code: string;
  name: string;
  secondary?: string;
  category?: string;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
}

// In-memory persistent master registry preloaded with all 13 tables from BAR CODE GENERATION VARIABLES.docx
const QR_13_MASTERS_STORE: Record<string, QRMasterItem[]> = {
  // 1. System Code Master
  'system-code': [
    { id: 'sc-1', tableKey: 'system-code', code: 'FT', name: 'FertiTrace', description: 'Core FertiTrace laboratory witnessing identification code', isActive: true, isDefault: true },
    { id: 'sc-2', tableKey: 'system-code', code: 'SMART', name: 'SMART IVF', description: 'Legacy SMART application cross-compatibility system tag', isActive: true },
    { id: 'sc-3', tableKey: 'system-code', code: 'RFID', name: 'RFID Dual', description: 'Hybrid Barcode and RFID integrated witness identifier', isActive: true },
  ],

  // 2. QR Version Code Master
  'qr-version': [
    { id: 'qv-1', tableKey: 'qr-version', code: 'V1', name: 'Version 1.0 (Pipe Delimited)', description: 'Standard 11-field pipe delimited structure: FT|V1|CL001|...', isActive: true, isDefault: true },
    { id: 'qv-2', tableKey: 'qr-version', code: 'V2', name: 'Version 2.0 (Compact Hash)', description: 'Compact alphanumeric high-density format for micro-vials & straws', isActive: true },
  ],

  // 3. CLINIC ID Master
  'clinic-id': [
    { id: 'cl-1', tableKey: 'clinic-id', code: 'CL001', name: 'Main Centre - IVF Lab', secondary: 'Tower A, Floor 3', description: 'Primary hospital IVF embryology laboratory', isActive: true, isDefault: true },
    { id: 'cl-2', tableKey: 'clinic-id', code: 'CL002', name: 'Satellite Clinic 1 - Andrology', secondary: 'North Wing', description: 'Branch andrology collection & semen prep center', isActive: true },
    { id: 'cl-3', tableKey: 'clinic-id', code: 'CL003', name: 'Satellite Clinic 2 - Cryobank', secondary: 'Vault B', description: 'Off-site long term vitrification storage facility', isActive: true },
  ],

  // 4. SMART ID / FertiTrace ID Master
  'smart-id': [
    { id: 'si-1', tableKey: 'smart-id', code: 'CASE26001234', name: 'Standard Case Pattern', secondary: 'CASE + YY + 6 Digits', description: 'Patient non-meaningful pseudonymized case barcode identifier', isActive: true, isDefault: true },
    { id: 'si-2', tableKey: 'smart-id', code: 'UHID-2026-9081', name: 'Hospital UHID Pattern', secondary: 'UHID + Year + 4 Digits', description: 'Hospital Enterprise Master Patient Index identifier', isActive: true },
    { id: 'si-3', tableKey: 'smart-id', code: 'FT-PAT-00452', name: 'FertiTrace Direct RFID Tag', secondary: 'FT-PAT + Sequence', description: 'Pre-linked biometric patient smartcard tag', isActive: true },
  ],

  // 5. Cycle ID Master
  'cycle-id': [
    { id: 'cy-1', tableKey: 'cycle-id', code: 'CY2600456', name: 'Fresh IVF Cycle', secondary: 'Farah Mohammed Khan', description: 'Active patient cycle retrieved from patient cycle registry', isActive: true, isDefault: true },
    { id: 'cy-2', tableKey: 'cycle-id', code: 'CY2600457', name: 'FET Cycle', secondary: 'Ananya Sharma', description: 'Frozen embryo thaw and transfer cycle', isActive: true },
    { id: 'cy-3', tableKey: 'cycle-id', code: 'CY2600458', name: 'Oocyte Vitrification Cycle', secondary: 'Pooja Patil', description: 'Elective social and medical oocyte cryopreservation', isActive: true },
  ],

  // 6. Specimen ID Master
  'specimen-id': [
    { id: 'sp-1', tableKey: 'specimen-id', code: 'SP000789', name: 'Specimen Registry #789', secondary: 'Day 5 Blastocyst', description: 'Primary single-cell and cohort traceability identifier', isActive: true, isDefault: true },
    { id: 'sp-2', tableKey: 'specimen-id', code: 'OO-26-001201', name: 'Oocyte Cohort Dish #1', secondary: 'MII Oocyte', description: 'Vitrified oocyte straw identifier', isActive: true },
    { id: 'sp-3', tableKey: 'specimen-id', code: 'SEM-26-00018472', name: 'Semen Sample Container', secondary: 'Husband Fresh', description: 'Andrology validated sperm specimen jar', isActive: true },
  ],

  // 7. Specimen Type Master (EMBRYO, SEMEN, OOCYTES as in docx)
  'specimen-type': [
    { id: 'st-1', tableKey: 'specimen-type', code: 'EMBRYO', name: 'EMBRYO', category: 'Clinical Embryology', description: 'Cleavage stage, morula, or blastocyst embryo specimen', isActive: true, isDefault: true },
    { id: 'st-2', tableKey: 'specimen-type', code: 'SEMEN', name: 'SEMEN', category: 'Andrology', description: 'Fresh, frozen, or prepared donor/partner semen sample', isActive: true },
    { id: 'st-3', tableKey: 'specimen-type', code: 'OOCYTES', name: 'OOCYTES', category: 'Clinical Embryology', description: 'Retrieved cumulus-oocyte complex, MII, MI, or GV eggs', isActive: true },
  ],

  // 8. START PROCESS DATE / TIME Master
  'process-datetime': [
    { id: 'pdt-1', tableKey: 'process-datetime', code: 'DD MM YY HH mm', name: 'Docx Compact Space-Separated', secondary: '04 12 20 14 46', description: 'Only last two digits of year (2020 -> 20) with 24-hr time e.g. 14.46', isActive: true, isDefault: true },
    { id: 'pdt-2', tableKey: 'process-datetime', code: 'YYYYMMDDTHHmm', name: 'ISO 8601 Compact', secondary: '20261010T0120', description: 'Standard high-density machine-readable timestamp for QR payload', isActive: true },
    { id: 'pdt-3', tableKey: 'process-datetime', code: 'YYMMDDHHmm', name: '10-Digit Pure Numeric', secondary: '2610100120', description: 'Ultra-compact barcode scanner format for small straw labels', isActive: true },
  ],

  // 9. CONSUMABLE TYPE Master (01 to 13 as in docx)
  'consumable-type': [
    { id: 'ct-01', tableKey: 'consumable-type', code: '01', name: 'SEMEN CONTAINER JAR', category: 'Andrology', description: 'Specimen collection container for semen reception', isActive: true },
    { id: 'ct-02', tableKey: 'consumable-type', code: '02', name: 'CONICAL TUBE', category: 'General Lab', description: 'General centrifuge conical tube for density gradient separation', isActive: true },
    { id: 'ct-03', tableKey: 'consumable-type', code: '03', name: 'FALCON TUBE 5ML', category: 'General Lab', description: '5ml culture tube for sperm washing and swim-up incubation', isActive: true },
    { id: 'ct-04', tableKey: 'consumable-type', code: '04', name: 'APPENDROFF (EPPENDORF)', category: 'General Lab', description: 'Microcentrifuge tube for sperm pellet or buffer storage', isActive: true },
    { id: 'ct-05', tableKey: 'consumable-type', code: '05', name: 'IUI CATHETER', category: 'Catheter', description: 'Insemination cannula used for intrauterine transfer', isActive: true },
    { id: 'ct-06', tableKey: 'consumable-type', code: '06', name: 'FACLON TUBE 15ML', category: 'General Lab', description: '15ml falcon tube for density centrifugation and media warming', isActive: true },
    { id: 'ct-07', tableKey: 'consumable-type', code: '07', name: 'PERTIDISH', category: 'Culture Dish', description: 'Standard petri dish for oocyte denudation and culture', isActive: true, isDefault: true },
    { id: 'ct-08', tableKey: 'consumable-type', code: '08', name: 'CENTRE WELL', category: 'Culture Dish', description: 'Organ culture centre-well dish for OPU collection & fertilization', isActive: true },
    { id: 'ct-09', tableKey: 'consumable-type', code: '09', name: 'ICSI DISH', category: 'Culture Dish', description: 'Micromanipulation dish with PVP and oil droplets for microinjection', isActive: true },
    { id: 'ct-10', tableKey: 'consumable-type', code: '10', name: 'FOUR WELL', category: 'Culture Dish', description: '4-well multidish for sequential extended embryo culture', isActive: true },
    { id: 'ct-11', tableKey: 'consumable-type', code: '11', name: 'EMBRYO TRANSFER CATHETER', category: 'Catheter', description: 'Soft ultrasound-guided catheter for clinical embryo transfer', isActive: true },
    { id: 'ct-12', tableKey: 'consumable-type', code: '12', name: 'VITRIFICATION STRAW', category: 'Cryopreservation', description: 'High survival vitrification straw (Cryotop / CBS) for LN2 plunge', isActive: true },
    { id: 'ct-13', tableKey: 'consumable-type', code: '13', name: 'VITRIFICATION CRYOVIAL', category: 'Cryopreservation', description: 'Screw-cap cryogenic vial for sperm/tissue banking in liquid nitrogen', isActive: true },
  ],

  // 10. PROCEDURE Master (17 procedures from docx)
  'procedure': [
    { id: 'pr-01', tableKey: 'procedure', code: 'HSA', name: 'HSA', category: 'Andrology', description: 'Husband Semen Analysis diagnostic evaluation', isActive: true },
    { id: 'pr-02', tableKey: 'procedure', code: 'SQA', name: 'SQA', category: 'Andrology', description: 'Semen Qualitative Analysis automated screening', isActive: true },
    { id: 'pr-03', tableKey: 'procedure', code: 'IUI_S_H', name: 'IUI SINGLE HUSBAND', category: 'Insemination', description: 'Intrauterine insemination with single partner sample', isActive: true },
    { id: 'pr-04', tableKey: 'procedure', code: 'IUI_D_H', name: 'IUI DOUBLE HUSBAND', category: 'Insemination', description: 'Double intrauterine insemination with partner sample', isActive: true },
    { id: 'pr-05', tableKey: 'procedure', code: 'THAW_H_S', name: 'THAW HUSBAND SINGLE', category: 'Insemination', description: 'Thawed husband sample single IUI procedure', isActive: true },
    { id: 'pr-06', tableKey: 'procedure', code: 'THAW_H_D', name: 'THAW HUSBAND DOUBLE', category: 'Insemination', description: 'Thawed husband sample double IUI procedure', isActive: true },
    { id: 'pr-07', tableKey: 'procedure', code: 'THAW_D_S', name: 'THAW DONOR SINGLE', category: 'Insemination', description: 'Thawed donor sperm sample single IUI procedure', isActive: true },
    { id: 'pr-08', tableKey: 'procedure', code: 'THAW_D_D', name: 'THAW DONOR DOUBLE', category: 'Insemination', description: 'Thawed donor sperm sample double IUI procedure', isActive: true },
    { id: 'pr-09', tableKey: 'procedure', code: 'SELF_H_F', name: 'SELF HUSBAND FREEZING', category: 'Cryopreservation', description: 'Cryopreservation and banking of partner sperm', isActive: true },
    { id: 'pr-10', tableKey: 'procedure', code: 'IVF', name: 'IVF CYCLE', category: 'Embryology', description: 'Standard conventional in-vitro fertilization treatment cycle', isActive: true, isDefault: true },
    { id: 'pr-11', tableKey: 'procedure', code: 'EMB_F', name: 'EMBRYO FREEZING', category: 'Cryopreservation', description: 'Vitrification of cleaved embryos or blastocysts', isActive: true },
    { id: 'pr-12', tableKey: 'procedure', code: 'FET', name: 'FET CYCLE', category: 'Embryology', description: 'Frozen embryo thaw and uterine transfer cycle', isActive: true },
    { id: 'pr-13', tableKey: 'procedure', code: 'OCC_F', name: 'OCCYTE FREEZING', category: 'Cryopreservation', description: 'Oocyte vitrification for social or fertility preservation', isActive: true },
    { id: 'pr-14', tableKey: 'procedure', code: 'THAW_OCC', name: 'THAW OCCYTE CYCLE', category: 'Embryology', description: 'Warming of frozen oocytes followed by ICSI microinjection', isActive: true },
    { id: 'pr-15', tableKey: 'procedure', code: 'ED', name: 'ED CYCLE', category: 'Embryology', description: 'Egg Donation fresh recipient stimulation cycle', isActive: true },
    { id: 'pr-16', tableKey: 'procedure', code: 'ED_F', name: 'ED FREEZING CYCLE', category: 'Cryopreservation', description: 'Donor oocyte cohort vitrification cycle', isActive: true },
    { id: 'pr-17', tableKey: 'procedure', code: 'ED_THAW', name: 'ED THAW CYCLE', category: 'Embryology', description: 'Thaw and fertilisation of banked donor oocyte batch', isActive: true },
  ],

  // 11. CONSUMABLE / UNIT No. Master
  'consumable-unit': [
    { id: 'cu-01', tableKey: 'consumable-unit', code: '01', name: 'Unit 01', description: 'Dish / Vial / Straw Unit 1 in cohort sequence', isActive: true, isDefault: true },
    { id: 'cu-02', tableKey: 'consumable-unit', code: '02', name: 'Unit 02', description: 'Dish / Vial / Straw Unit 2 in cohort sequence', isActive: true },
    { id: 'cu-03', tableKey: 'consumable-unit', code: '03', name: 'Unit 03', description: 'Dish / Vial / Straw Unit 3 in cohort sequence', isActive: true },
    { id: 'cu-04', tableKey: 'consumable-unit', code: '04', name: 'Unit 04', description: 'Dish / Vial / Straw Unit 4 in cohort sequence', isActive: true },
    { id: 'cu-05', tableKey: 'consumable-unit', code: '05', name: 'Unit 05', description: 'Dish / Vial / Straw Unit 5 in cohort sequence', isActive: true },
  ],

  // 12. LABELS SIZE Master (A/B/C/D/E/F as in docx)
  'label-size': [
    { id: 'ls-A', tableKey: 'label-size', code: 'A', name: '35 x 22 mm', secondary: 'Roll A', description: 'Cryo Straws & Cryovials (CST 79N0T)', isActive: true },
    { id: 'ls-B', tableKey: 'label-size', code: 'B', name: '50.8 x 25.4 mm', secondary: 'Roll B', description: 'Petri Dishes & Four-well Culture Plates (CST 28N0T)', isActive: true, isDefault: true },
    { id: 'ls-C', tableKey: 'label-size', code: 'C', name: '50.8 x 6.4 mm', secondary: 'Roll C', description: 'Ultra-thin Straw Flag Label (AMA 227NP)', isActive: true },
    { id: 'ls-D', tableKey: 'label-size', code: 'D', name: '35 x 22 mm', secondary: 'Roll D', description: 'Standard Falcon Tubes 5ml & 15ml (CRF 510NP)', isActive: true },
    { id: 'ls-E', tableKey: 'label-size', code: 'E', name: '25 x 12 mm', secondary: 'Roll E', description: 'Microcentrifuge / Eppendorf Tubes (SMP 140NP)', isActive: true },
    { id: 'ls-F', tableKey: 'label-size', code: 'F', name: '85.6 x 54 mm', secondary: 'Roll F', description: 'Patient Smartcard / Identity Tag (PID 855NP)', isActive: true },
  ],

  // 13. Signature / Checksum Master
  'signature-checksum': [
    { id: 'sig-1', tableKey: 'signature-checksum', code: 'SIG12345', name: 'FNV-1a Hash 5-Hex Checksum', secondary: 'Standard Alg.', description: 'Tamper-evident 8-character cryptographic signature for QR payload verification', isActive: true, isDefault: true },
    { id: 'sig-2', tableKey: 'signature-checksum', code: 'CRC32', name: 'CRC32 Checksum Algorithm', secondary: 'High Speed', description: 'Fast cyclic redundancy code used in handheld hardware scanners', isActive: true },
    { id: 'sig-3', tableKey: 'signature-checksum', code: 'USER-DR-ADMIN', name: 'Dr. Admin Electronic Signature', secondary: 'PIN Verified', description: 'Digital sign-off token of senior embryologist supervisor', isActive: true },
  ],
};

import { getPool } from '@/lib/db/pool';
import sql from 'mssql';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tableKey = searchParams.get('table');

    try {
      const pool = await getPool();
      if (tableKey) {
        const qRes = await pool
          .request()
          .input('TableKey', sql.VarChar(64), tableKey)
          .query(`
            SELECT ID AS id, TableKey AS tableKey, Code AS code, Name AS name,
                   Secondary AS secondary, Category AS category, Description AS description,
                   IsActive AS isActive, IsDefault AS isDefault, SortOrder AS sortOrder
            FROM FertiTrace_QR_Masters
            WHERE TableKey = @TableKey
            ORDER BY SortOrder ASC, Code ASC
          `);
        return NextResponse.json({ success: true, tableKey, items: qRes.recordset, source: 'database' });
      }

      const allRes = await pool.request().query(`
        SELECT ID AS id, TableKey AS tableKey, Code AS code, Name AS name,
               Secondary AS secondary, Category AS category, Description AS description,
               IsActive AS isActive, IsDefault AS isDefault, SortOrder AS sortOrder
        FROM FertiTrace_QR_Masters
        ORDER BY TableKey ASC, SortOrder ASC, Code ASC
      `);

      const tables: Record<string, QRMasterItem[]> = {};
      for (const row of allRes.recordset) {
        if (!tables[row.tableKey]) {
          tables[row.tableKey] = [];
        }
        tables[row.tableKey].push({
          id: row.id,
          tableKey: row.tableKey,
          code: row.code,
          name: row.name,
          secondary: row.secondary || undefined,
          category: row.category || undefined,
          description: row.description || undefined,
          isActive: Boolean(row.isActive),
          isDefault: Boolean(row.isDefault),
        });
      }

      // If database has records, return them dynamically
      if (Object.keys(tables).length > 0) {
        return NextResponse.json({ success: true, tables, source: 'database' });
      }
    } catch (dbErr) {
      console.warn('Database error in GET /api/qr/masters, falling back to memory store:', dbErr);
    }

    // Fallback if DB is empty or during offline development
    if (tableKey) {
      const items = QR_13_MASTERS_STORE[tableKey] || [];
      return NextResponse.json({ success: true, tableKey, items, source: 'fallback' });
    }
    return NextResponse.json({ success: true, tables: QR_13_MASTERS_STORE, source: 'fallback' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch QR masters';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableKey, code, name, secondary, category, description, isActive = true, isDefault = false } = body;

    if (!tableKey || !code || !name) {
      return NextResponse.json({ success: false, error: 'TableKey, code, and name are required.' }, { status: 400 });
    }

    const id = `${tableKey}-${Date.now().toString().slice(-6)}`;

    try {
      const pool = await getPool();
      await pool
        .request()
        .input('ID', sql.VarChar(64), id)
        .input('TableKey', sql.VarChar(64), tableKey)
        .input('Code', sql.NVarChar(128), code.trim())
        .input('Name', sql.NVarChar(256), name.trim())
        .input('Secondary', sql.NVarChar(256), secondary?.trim() || null)
        .input('Category', sql.NVarChar(128), category?.trim() || null)
        .input('Description', sql.NVarChar(512), description?.trim() || null)
        .input('IsActive', sql.Bit, isActive ? 1 : 0)
        .input('IsDefault', sql.Bit, isDefault ? 1 : 0)
        .input('SortOrder', sql.Int, 99)
        .query(`
          INSERT INTO FertiTrace_QR_Masters (ID, TableKey, Code, Name, Secondary, Category, Description, IsActive, IsDefault, SortOrder)
          VALUES (@ID, @TableKey, @Code, @Name, @Secondary, @Category, @Description, @IsActive, @IsDefault, @SortOrder)
        `);

      const newItem: QRMasterItem = {
        id,
        tableKey,
        code: code.trim(),
        name: name.trim(),
        secondary: secondary?.trim(),
        category: category?.trim(),
        description: description?.trim(),
        isActive,
        isDefault,
      };

      // Also mirror to in-memory store
      if (!QR_13_MASTERS_STORE[tableKey]) QR_13_MASTERS_STORE[tableKey] = [];
      QR_13_MASTERS_STORE[tableKey].unshift(newItem);

      return NextResponse.json({ success: true, item: newItem, source: 'database' });
    } catch (dbErr) {
      console.warn('Database error in POST /api/qr/masters, writing to memory store:', dbErr);
      if (!QR_13_MASTERS_STORE[tableKey]) QR_13_MASTERS_STORE[tableKey] = [];
      const newItem: QRMasterItem = {
        id,
        tableKey,
        code: code.trim(),
        name: name.trim(),
        secondary: secondary?.trim(),
        category: category?.trim(),
        description: description?.trim(),
        isActive,
        isDefault,
      };
      QR_13_MASTERS_STORE[tableKey].unshift(newItem);
      return NextResponse.json({ success: true, item: newItem, source: 'fallback' });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create QR master item';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, tableKey, code, name, secondary, category, description, isActive, isDefault } = body;

    if (!id || !tableKey) {
      return NextResponse.json({ success: false, error: 'ID and TableKey are required for update.' }, { status: 400 });
    }

    try {
      const pool = await getPool();
      await pool
        .request()
        .input('ID', sql.VarChar(64), id)
        .input('TableKey', sql.VarChar(64), tableKey)
        .input('Code', sql.NVarChar(128), code !== undefined ? code.trim() : '')
        .input('Name', sql.NVarChar(256), name !== undefined ? name.trim() : '')
        .input('Secondary', sql.NVarChar(256), secondary !== undefined ? secondary?.trim() || null : null)
        .input('Category', sql.NVarChar(128), category !== undefined ? category?.trim() || null : null)
        .input('Description', sql.NVarChar(512), description !== undefined ? description?.trim() || null : null)
        .input('IsActive', sql.Bit, isActive !== undefined ? (isActive ? 1 : 0) : 1)
        .input('IsDefault', sql.Bit, isDefault !== undefined ? (isDefault ? 1 : 0) : 0)
        .query(`
          UPDATE FertiTrace_QR_Masters
          SET Code = @Code,
              Name = @Name,
              Secondary = @Secondary,
              Category = @Category,
              Description = @Description,
              IsActive = @IsActive,
              IsDefault = @IsDefault,
              UpdatedAt = GETDATE()
          WHERE ID = @ID AND TableKey = @TableKey
        `);

      const updatedItem: QRMasterItem = {
        id,
        tableKey,
        code: code !== undefined ? code.trim() : '',
        name: name !== undefined ? name.trim() : '',
        secondary: secondary !== undefined ? secondary?.trim() : undefined,
        category: category !== undefined ? category?.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault !== undefined ? isDefault : false,
      };

      // Also update in-memory cache
      const items = QR_13_MASTERS_STORE[tableKey];
      if (items) {
        const idx = items.findIndex((it) => it.id === id);
        if (idx !== -1) items[idx] = updatedItem;
      }

      return NextResponse.json({ success: true, item: updatedItem, source: 'database' });
    } catch (dbErr) {
      console.warn('Database error in PUT /api/qr/masters, updating memory store:', dbErr);
      const items = QR_13_MASTERS_STORE[tableKey];
      if (!items) {
        return NextResponse.json({ success: false, error: 'Table not found.' }, { status: 404 });
      }
      const idx = items.findIndex((it) => it.id === id);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: 'Item not found in master table.' }, { status: 404 });
      }
      items[idx] = {
        ...items[idx],
        code: code !== undefined ? code.trim() : items[idx].code,
        name: name !== undefined ? name.trim() : items[idx].name,
        secondary: secondary !== undefined ? secondary?.trim() : items[idx].secondary,
        category: category !== undefined ? category?.trim() : items[idx].category,
        description: description !== undefined ? description?.trim() : items[idx].description,
        isActive: isActive !== undefined ? isActive : items[idx].isActive,
        isDefault: isDefault !== undefined ? isDefault : items[idx].isDefault,
      };
      return NextResponse.json({ success: true, item: items[idx], source: 'fallback' });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update QR master item';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const tableKey = searchParams.get('tableKey');

    if (!id || !tableKey) {
      return NextResponse.json({ success: false, error: 'ID and TableKey are required for deletion.' }, { status: 400 });
    }

    try {
      const pool = await getPool();
      await pool
        .request()
        .input('ID', sql.VarChar(64), id)
        .input('TableKey', sql.VarChar(64), tableKey)
        .query(`
          DELETE FROM FertiTrace_QR_Masters
          WHERE ID = @ID AND TableKey = @TableKey
        `);

      // Also remove from in-memory cache
      if (QR_13_MASTERS_STORE[tableKey]) {
        QR_13_MASTERS_STORE[tableKey] = QR_13_MASTERS_STORE[tableKey].filter((it) => it.id !== id);
      }

      return NextResponse.json({ success: true, deletedId: id, source: 'database' });
    } catch (dbErr) {
      console.warn('Database error in DELETE /api/qr/masters, deleting from memory store:', dbErr);
      const items = QR_13_MASTERS_STORE[tableKey];
      if (!items) {
        return NextResponse.json({ success: false, error: 'Table not found.' }, { status: 404 });
      }
      QR_13_MASTERS_STORE[tableKey] = items.filter((it) => it.id !== id);
      return NextResponse.json({ success: true, deletedId: id, source: 'fallback' });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete QR master item';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
