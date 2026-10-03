# FertiTrace QR requirement plan

Source: `Downloads/qrcodefile` (barcode variables, data breakup, lifecycle retention, QR flow).

Fertitrace already has Label Printing, Cryo Navigation scan, and a Witness screen. This plan is the QR identity those screens must follow. It does not replace cycle, retrieval, or embryo clinical logic.

## Goal

Print and scan a QR that identifies a specimen and container. The database holds the clinical record. The QR never holds patient name, mobile, address, Aadhaar, diagnosis, history, embryo grade, or genetic result.

Specimen ID is the traceability key. It stays the same from OPU through oocyte, fertilisation, zygote, embryo, biopsy, cryo, thaw, and transfer.

## QR string (version V1)

`FT|V1|CL001|CASE26001234|CY2600456|SP000789|OOCYTE|DISH|01|20260908T0835|SIG12345`

| # | Field | Example | Rule |
|---|---|---|---|
| 1 | System code | `FT` | Fixed. Identifies FertiTrace. |
| 2 | QR version | `V1` | Reject unknown versions. |
| 3 | Clinic / site ID | `CL001` | From the logged-in clinic. |
| 4 | Case / patient ID | `CASE26001234` | Non-meaningful ID only. |
| 5 | Cycle ID | `CY2600456` | The cycle this specimen belongs to. |
| 6 | Specimen ID | `SP000789` | Unique. Primary key for scans. |
| 7 | Specimen type | `OOCYTE` | Master: Embryo, Semen, Oocytes. |
| 8 | Container type | `DISH` | Master code for the physical container. |
| 9 | Unit number | `01` | Dish, straw, or vial number. |
| 10 | Created at | `20260908T0835` | Date and time the QR record was created. |
| 11 | Checksum | `SIG12345` | Tamper check. Scan fails if it does not match. |

The printed label also shows a short alphanumeric line (location and procedure), separate from this pipe string.

## Masters

Add these before printing is allowed.

**Specimen type:** Embryo, Semen, Oocytes.

**Consumable / container**

| Code | Name |
|---|---|
| 01 | Semen container jar |
| 02 | Conical tube |
| 03 | Falcon tube 5 ml |
| 04 | Eppendorf |
| 05 | IUI catheter |
| 06 | Falcon tube 15 ml |
| 07 | Petri dish |
| 08 | Centre well |
| 09 | ICSI dish |
| 10 | Four well |
| 11 | Embryo transfer catheter |
| 12 | Vitrification straw |
| 13 | Vitrification cryovial |

**Procedure:** HSA, SQA, IUI Single Husband, IUI Double Husband, Thaw Husband Single, Thaw Husband Double, Thaw Donor Single, Thaw Donor Double, Self Husband Freezing, IVF Cycle, Embryo Freezing, FET Cycle, Oocyte Freezing, Thaw Oocyte Cycle, ED Cycle, ED Freezing Cycle, ED Thaw Cycle.

**Unit number:** 01, 02, 03 (extendable).

**Label size:** A, B, C, D, E, F. Choosing a size tells the user which printer roll to load.

## What must be built

### 1. Generate a system QR

- User picks patient, cycle, specimen type, container, unit, and procedure.
- System creates a new Specimen ID and checksum, status `ACTIVE`.
- One identity per physical container. Reprint uses the same QR. It does not mint a second specimen.

### 2. Print

- Print one label or many, including different patients and different label choices in one job.
- Each label shows the QR and the alphanumeric code.
- Label size selects the layout and shows which roll to load.
- Printer connection: USB or Wi-Fi.

**Alphanumeric examples (location text on the label, not inside the clinical QR)**

- Embryo / oocyte straw: canister, cane, goblet, visotube, colour. Example compact line `BA52C9GOBLVERDVIBLSTBR`.
- Semen cryovial: example `BA54C1CHDU1WH`.
- Short procedure labels: HSA or IUI on a semen jar, IVF on a petri dish.

### 3. Scan and validate

- Handheld scanner: Wi-Fi, Bluetooth, and GPS capable. The scan field is focused and accepts a wedge scan.
- One match opens that specimen on screen.
- Several items in the same zone: list them and let the user pick one.
- Check the string against the QR master:
  - Match and status allows use: **OK**.
  - Wrong patient, wrong cycle, bad checksum, unknown code, or closed code: **Mismatch**, with a sound or alarm.
- Every scan is written to the audit log (user, time, result, location if the scanner provides it).

### 4. Close, do not delete

When the procedure for that container is finished, the QR becomes inactive and cannot be edited or reused.

Keep the row. Set status only:

| Stage | Status |
|---|---|
| Generated | ACTIVE |
| OPU, fertilisation, embryo culture | IN_PROCESS |
| Frozen | CRYOPRESERVED (location and container stored) |
| Thawed | THAWED |
| Transferred | TRANSFERRED / CLOSED |
| Discarded | DISPOSED / CLOSED (user, time, reason) |
| Cancelled | CANCELLED (reason required) |

A closed code still scans, but the result is Mismatch / inactive, not a new active specimen.

### 5. Pre-assigned labels

Market labels that already have a code need a separate screen:

- Scan the pre-printed code.
- Allot it to a patient, cycle, specimen, and container.
- Reject a code that is already allotted.
- After allotment it follows the same lifecycle as a system-generated QR.

### 6. Inventory

- Issuing or printing a label/consumable creates an inventory movement.
- Completing or closing the procedure updates that stock.
- This sits behind the label flow. It is not a second clinical chart.

### 7. Two hardware tracks

| | QR only | QR + RFID |
|---|---|---|
| System-generated | Yes | Yes |
| Pre-assigned | Yes | Yes |
| Reader | QR scanner and printer | QR + RFID scanner and printer |
| Named places | LF-1, Cryocan | LF-1, Cryocan |

Build the QR track first. RFID uses the same specimen identity and adds a second scan that must match it. A mismatch uses the existing mismatch alarm.

## Data to store

- **QR master:** the 11 fields, checksum, status, created by, created at, closed at, close reason.
- **Specimen / container:** specimen ID, type, container, unit, procedure, storage location text.
- **Traceability log:** scan, witness, move, status change, user, time, OK or mismatch. Never deleted.

## Delivery order

1. Masters (specimen, container, procedure, unit, label size).
2. Generate V1 QR and save QR master + specimen row.
3. Print one and many labels, with roll warning by size.
4. Scan: OK, mismatch, alarm, audit line.
5. Status changes through the lifecycle. No delete.
6. Pre-assigned label allotment.
7. Inventory issue and completion update.
8. RFID match against the same specimen ID.

## Out of this plan

- Patient name or clinical results inside the QR.
- Deleting a QR row after transfer, disposal, or cancel.
- New cycle, retrieval, or embryo fields that are not in these four documents.
- Final on-screen layout. That is confirmed when the clinic walks through the software. Extra points they add then are a later change, not part of this version.

## Acceptance

- A printed code scans back to the same specimen, cycle, and container.
- A code for another patient in the same zone is Mismatch and is audited.
- Closing a procedure blocks edit and reprint-as-new, and the history row is still searchable.
- A pre-assigned code cannot be allotted twice.
- Label size A–F changes the print layout and the roll instruction.
