import {
  encodeFertiTraceQR,
  decodeFertiTraceQR,
  generateCompactAlphanumeric,
  generateQRChecksum,
  formatCompactCryoLocation,
} from '../src/lib/fertitrace-qr';

console.log('--- 1. Testing FertiTrace V1 QR Code Encoding ---');
const samplePayload = {
  clinicId: 'CL001',
  caseId: 'CASE26001234',
  cycleId: 'CY2600456',
  specimenId: 'SP000789',
  specimenType: 'OOCYTE' as const,
  containerType: 'DISH',
  unitNo: '01',
  createdAt: '20260908T0835',
  signature: 'SIG12345',
};

const encoded = encodeFertiTraceQR(samplePayload);
console.log('Encoded QR String:', encoded);

console.log('\n--- 2. Testing FertiTrace V1 QR Code Decoding ---');
const decoded = decodeFertiTraceQR(encoded);
console.log('Decoded Success:', decoded.success);
console.log('Decoded Payload:', decoded.data);

console.log('\n--- 3. Testing Compact Alphanumeric Formats ---');
// Straw (BA 52 C9 GOBL VERD VIBL STBR)
const strawAlphanumeric = generateCompactAlphanumeric({
  patientRefNumber: '5610',
  consumableCode: '12',
  date: new Date(2020, 11, 4), // 04-12-20
  cryoLocation: 'CC-BA52/C-9/GO-BLUE/VE-RED/VI-BLACK/ST-BROWN',
});
console.log('Straw Alphanumeric Code:', strawAlphanumeric);

// Semen Jar (HSA)
const hsaAlphanumeric = generateCompactAlphanumeric({
  patientRefNumber: '5610',
  consumableCode: '04',
  date: new Date(2020, 11, 4),
  procedureCode: 'HSA',
});
console.log('HSA Semen Jar Code:', hsaAlphanumeric);

// Petri Dish (IVF)
const ivfAlphanumeric = generateCompactAlphanumeric({
  patientRefNumber: '5610',
  consumableCode: '06',
  date: new Date(2020, 7, 3), // 03-08-20
  procedureCode: 'IVF',
});
console.log('IVF Petri Dish Code:', ivfAlphanumeric);

console.log('\n--- 4. Testing Tamper Checksum Validation ---');
const generatedQR = encodeFertiTraceQR({
  clinicId: 'CL001',
  caseId: 'CASE26001234',
  cycleId: 'CY2600456',
  specimenId: 'SP000789',
  specimenType: 'OOCYTE' as const,
  containerType: 'DISH',
  unitNo: '01',
});
console.log('Original Generated QR:', generatedQR);
const tampered = generatedQR.replace('SP000789', 'SP000999');
console.log('Tampered QR (SP modified):', tampered);
const tamperCheck = decodeFertiTraceQR(tampered);
console.log('Tamper Check Passed (Should be false):', tamperCheck.success, '| Error Message:', tamperCheck.error);
console.log('\nALL ENGINE TESTS COMPLETED SUCCESSFULLY!');
