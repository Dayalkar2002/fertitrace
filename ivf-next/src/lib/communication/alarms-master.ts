export type AlarmSeverity = 'Critical' | 'Warning' | 'Informational';
export type SmartForwardRule = 'yes' | 'retry_queue';

export interface AlarmMasterItem {
  numericId: number;
  eventId: string;
  title: string;
  severity: AlarmSeverity;
  forwardToSmart: SmartForwardRule;
  externalSms: boolean;
  externalWhatsApp: boolean;
  emailAudit: boolean;
}

/** FERTITRACE_Internal_Alarms_Master.xlsx + FT-E01..FT-E50 event list. */
export const ALARM_MASTER: AlarmMasterItem[] = [
  { numericId: 1, eventId: 'FT-E01', title: 'Patient/sample identity mismatch', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 2, eventId: 'FT-E02', title: 'Wrong QR code scanned', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 3, eventId: 'FT-E03', title: 'Wrong RFID detected', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 4, eventId: 'FT-E04', title: 'QR/RFID mismatch', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 5, eventId: 'FT-E05', title: 'Sample not found / unknown sample', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 6, eventId: 'FT-E06', title: 'Sample linked to wrong patient', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 7, eventId: 'FT-E07', title: 'Duplicate sample ID detected', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: false, emailAudit: true },
  { numericId: 8, eventId: 'FT-E08', title: 'Duplicate witnessing attempt', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 9, eventId: 'FT-E09', title: 'Required witnessing step skipped', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 10, eventId: 'FT-E10', title: 'Witnessing failed', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 11, eventId: 'FT-E11', title: 'Witnessing incomplete', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 12, eventId: 'FT-E12', title: 'Second-person witnessing not completed', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 13, eventId: 'FT-E13', title: 'Unauthorized user attempts witnessing', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 14, eventId: 'FT-E14', title: 'User/session authentication failure', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 15, eventId: 'FT-E15', title: 'Expired/invalid user authorization', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 16, eventId: 'FT-E16', title: 'Sample movement without required scan', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 17, eventId: 'FT-E17', title: 'Sample transferred to wrong location', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 18, eventId: 'FT-E18', title: 'Sample expected at location but not detected', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 19, eventId: 'FT-E19', title: 'Sample missing during workflow', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 20, eventId: 'FT-E20', title: 'Sample status conflict', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 21, eventId: 'FT-E21', title: 'Sample already used/consumed', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 22, eventId: 'FT-E22', title: 'Sample already discarded', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 23, eventId: 'FT-E23', title: 'Attempt to use cancelled sample', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 24, eventId: 'FT-E24', title: 'Attempt to use quarantined/blocked sample', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 25, eventId: 'FT-E25', title: 'Sample expiry/validity warning', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: true, emailAudit: true },
  { numericId: 26, eventId: 'FT-E26', title: 'Cryostorage location mismatch', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 27, eventId: 'FT-E27', title: 'Retrieval of wrong sample', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 28, eventId: 'FT-E28', title: 'Storage/re-storage scan failure', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 29, eventId: 'FT-E29', title: 'Embryo/oocyte/sperm identity mismatch', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 30, eventId: 'FT-E30', title: 'Procedure/sample association mismatch', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 31, eventId: 'FT-E31', title: 'Cycle/patient association mismatch', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 32, eventId: 'FT-E32', title: 'Unplanned workflow action', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 33, eventId: 'FT-E33', title: 'Mandatory field/data missing', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 34, eventId: 'FT-E34', title: 'Record modification after completion', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 35, eventId: 'FT-E35', title: 'Attempt to delete protected traceability record', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 36, eventId: 'FT-E36', title: 'Audit trail exception', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: false, emailAudit: true },
  { numericId: 37, eventId: 'FT-E37', title: 'RFID reader disconnected', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 38, eventId: 'FT-E38', title: 'QR/barcode scanner failure', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 39, eventId: 'FT-E39', title: 'Device communication failure', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 40, eventId: 'FT-E40', title: 'Network/server connection failure', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 41, eventId: 'FT-E41', title: 'SMART IVF/API connection failure', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 42, eventId: 'FT-E42', title: 'Event could not be forwarded to SMART IVF', severity: 'Critical', forwardToSmart: 'retry_queue', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 43, eventId: 'FT-E43', title: 'Unacknowledged critical alarm', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 44, eventId: 'FT-E44', title: 'Repeated alarm/event beyond configured threshold', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 45, eventId: 'FT-E45', title: 'System configuration changed', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 46, eventId: 'FT-E46', title: 'Critical master data changed', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 47, eventId: 'FT-E47', title: 'User role/permission changed', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 48, eventId: 'FT-E48', title: 'Device/configuration tampering', severity: 'Critical', forwardToSmart: 'yes', externalSms: true, externalWhatsApp: true, emailAudit: true },
  { numericId: 49, eventId: 'FT-E49', title: 'System restart/service interruption', severity: 'Warning', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
  { numericId: 50, eventId: 'FT-E50', title: 'Critical traceability event completed successfully', severity: 'Informational', forwardToSmart: 'yes', externalSms: false, externalWhatsApp: false, emailAudit: true },
];

export function getAlarmMaster(eventId: string): AlarmMasterItem | undefined {
  return ALARM_MASTER.find((row) => row.eventId === eventId);
}
