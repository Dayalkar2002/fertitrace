export type MessageChannel = 'SMS' | 'WhatsApp' | 'Email';

export interface SmsTemplate {
  id: string;
  label: string;
  messageType: string;
  captureScreen: string;
  activity: string;
  content: string;
  variables: string[];
  dltTemplateId?: string;
  dltRef?: string;
  channels: { sms: boolean; whatsapp: boolean; email: boolean };
}

/** DLT-approved templates keep exact registered wording. Others follow SMS Templates For Approval.xlsx. */
export const SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'appointment_first',
    label: 'Appointment (STPL Approved)',
    messageType: 'Appointment',
    captureScreen: 'Appointment Scheduler',
    activity: 'First Consultation',
    dltTemplateId: '1707161788735690119',
    dltRef: '07-HH4KN8WCY5H',
    content:
      'Dear [Patient Name], Your appointment has been booked with [Doctor Name] for [Procedure] at IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Doctor Name]', '[Procedure]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'appointment_reschedule',
    label: 'Reschedule Appointment (STPL Approved)',
    messageType: 'Reschedule',
    captureScreen: 'Appointment Scheduler',
    activity: 'Re-Schedule Consultation',
    dltTemplateId: '1707161788748638612',
    dltRef: '07-HH4KN8WFQ2B',
    content:
      'Dear [Patient Name],Your appointment with [Doctor Name] has been rescheduled for [Procedure] at IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft',
    variables: ['[Patient Name]', '[Doctor Name]', '[Procedure]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'appointment_followup',
    label: 'Follow Up (STPL Approved)',
    messageType: 'Follow Up',
    captureScreen: 'Appointment Scheduler',
    activity: 'Follow-up Consultation',
    dltTemplateId: '1707161788759596007',
    dltRef: '07-HH4KN8WI2M0',
    content:
      'Dear [Patient Name] Your appointment has been booked with [Doctor Name] for [Procedure] at IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft',
    variables: ['[Patient Name]', '[Doctor Name]', '[Procedure]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'appointment_cancel',
    label: 'Cancellation (STPL Approved)',
    messageType: 'Cancellation',
    captureScreen: 'Appointment Scheduler',
    activity: 'Cancellation - Consultation',
    dltTemplateId: '1707161788771098630',
    dltRef: '07-HH4KN8WKJD6',
    content:
      'Dear [Patient Name] Your appointment  with [Doctor Name] at IVF Craft Clinic at Andheri on [Date & Time] has been cancelled. Team IVF Craft.',
    variables: ['[Patient Name]', '[Doctor Name]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'fm_tic',
    label: 'Injection Appointment (STPL Approved)',
    messageType: 'Injection',
    captureScreen: 'FM',
    activity: 'FM+TIC PROCEDURE',
    dltTemplateId: '1707161788783460834',
    dltRef: '07-HH4KN8WN6R4',
    content: 'Dear [Patient Name], Your appointment has been booked for [Procedure] on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Procedure]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'iui_procedure',
    label: 'IUI Appointment (STPL Approved)',
    messageType: 'IUI Appointment',
    captureScreen: 'IUI / Appointment Scheduler',
    activity: 'IUI PROCEDURE',
    dltTemplateId: '1707161788814128413',
    dltRef: '07-HH4KN8WTRDZ',
    content:
      'Dear [Patient Name], Your appointment has been booked for [Procedure] at IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Procedure]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'iui_summary',
    label: 'IUI Summary',
    messageType: 'IUI Summary',
    captureScreen: 'IUI',
    activity: 'IUI SUMMARY',
    content: 'Dear [Patient Name] Your IUI Summary for the month of [Month], on [Date] is attached herewith.',
    variables: ['[Patient Name]', '[Month]', '[Date]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'fm_procedure',
    label: 'FM Procedure',
    messageType: 'FM Procedure',
    captureScreen: 'FM',
    activity: 'FM PROCEDURE',
    content:
      'Dear [Patient Name], Your appointment has been booked for Follicular Monitoring at IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'fm_blood_pink',
    label: 'FM & Blood Tests (Pink)',
    messageType: 'FM & Blood Tests',
    captureScreen: 'MONITORING SHEET PINK',
    activity: 'FM & BLOOD TESTS PROCEDURE',
    content:
      'Dear [Patient Name], Your appointment has been booked for TVS for Follicular Monitoring & Blood Test at IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'fm_blood_yellow',
    label: 'FM & Blood Tests (Yellow)',
    messageType: 'FM & Blood Tests',
    captureScreen: 'MONITORING SHEET YELLOW',
    activity: 'FM & BLOOD TESTS PROCEDURE',
    content:
      'Dear [Patient Name], Your appointment has been booked for TVS for Follicular Monitoring at IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'fm_blood_d9',
    label: 'FM & Blood Tests (D9)',
    messageType: 'FM & Blood Tests',
    captureScreen: 'MONITORING SHEET D9',
    activity: 'FM & BLOOD TESTS PROCEDURE',
    content:
      'Dear [Patient Name], Your appointment has been booked for TVS for Follicular Monitoring & Blood Test at IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'hcg_injection',
    label: 'HCG Injection (STPL Approved)',
    messageType: 'HCG INJECTION',
    captureScreen: 'MONITORING SHEET GREEN',
    activity: 'HCG INJECTION PROCEDURE',
    dltTemplateId: '1707161788923896459',
    dltRef: '07-HH4KN8XHAD0',
    content: 'Dear [Patient Name], Your HCG Injection is due on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'opu_preop',
    label: 'Pre-Operative Instruction (STPL Approved)',
    messageType: 'Pre Operative Instruction',
    captureScreen: 'MONITORING SHEET RED',
    activity: 'OVUM PICK UP PROCEDURE',
    dltTemplateId: '1707161788940100865',
    dltRef: '07-HH4KN8XKRE8',
    content:
      'Dear [Patient Name], Pre-Operative Instructios--You are instructed to get admitted on [Date & Time] for [Procedure]  at IVF Craft Clinic at Andheri. ( For Ovum Pickup please come  fasting overnight, inform regarding any ongoing medications for any other conditions to the nursing staff). Team IVF Craft.',
    variables: ['[Patient Name]', '[Date & Time]', '[Procedure]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'opu_postop',
    label: 'Post-Operative Instruction (STPL Approved)',
    messageType: 'Post Operative Instruction',
    captureScreen: 'MONITORING SHEET RED EVENING',
    activity: 'POST OP INSTRUCTIONS',
    dltTemplateId: '1707161788954009948',
    dltRef: '07-HH4KN8XNQPV',
    content:
      'Dear [Patient Name], Post-Operative Instrcutions---Your OPU has been  done at IVF Craft Clinic at Andheri on [Date & Time], If you feel any discomfort like nausea/vomitting, fever, abdominal distension, giddiness, bleeding PV etc please feel free to contact us. Team IVF Craft.',
    variables: ['[Patient Name]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'et_procedure',
    label: 'ET Procedure (STPL Approved)',
    messageType: 'ET Procedure',
    captureScreen: 'ET/BT SCREEN',
    activity: 'EMBRYO TRANSFER PROCEDURE',
    dltTemplateId: '1707161788976103020',
    dltRef: '07-HH4KN8XSH6V',
    content:
      'Dear [Patient Name], Your [Procedure] is scheduled at  IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Procedure]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'ivf_summary',
    label: 'IVF Summary (STPL Approved)',
    messageType: 'IVF SUMMARY',
    captureScreen: 'REPORT SHEET',
    activity: 'IVF SUMMARY',
    dltTemplateId: '1707161788987451572',
    dltRef: '07-HH4KN8XUWR7',
    content: 'Dear [Patient Name] Your IVF Summary for the month of [Date] is attached herewith.',
    variables: ['[Patient Name]', '[Date]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'bhcg',
    label: 'BHCG Blood Test (STPL Approved)',
    messageType: 'BHCG',
    captureScreen: 'B HCG DAY SCREEN',
    activity: 'BHCG BLOOD TEST PROCEDURE',
    dltTemplateId: '1707162832465411194',
    dltRef: '11-OVDKS1IGG7Z',
    content:
      'Dear [Patient Name] , Your appointment has been booked for B.HCG. Blood Test at IVF Craft Clinic at Andheri On [Date & Time]. Please bring 1st Urine Sample with you. Team IVF Craft.',
    variables: ['[Patient Name]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'sqa_test',
    label: 'SQA Test',
    messageType: 'SQA Test',
    captureScreen: 'Appointment Scheduler',
    activity: 'SQA TEST',
    content:
      'Dear [Patient Name], Your appointment has been booked for SQA at IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'sa_test',
    label: 'SA Test',
    messageType: 'SA Test',
    captureScreen: 'Appointment Scheduler',
    activity: 'SA TEST',
    content:
      'Dear [Patient Name], Your appointment has been booked for SA at IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'sf_test',
    label: 'SF Test',
    messageType: 'SF Test',
    captureScreen: 'Appointment Scheduler',
    activity: 'SF TEST',
    content:
      'Dear [Patient Name], Your appointment has been booked for SF at IVF Craft Clinic at Andheri on [Date & Time]. Team IVF Craft.',
    variables: ['[Patient Name]', '[Date & Time]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'sqa_summary',
    label: 'SQA Summary',
    messageType: 'SQA Summary',
    captureScreen: 'REPORT SHEET',
    activity: 'SQA SUMMARY',
    content: 'Dear [Patient Name] Your SQA Summary for the month of [Month], on [Date] is attached herewith.',
    variables: ['[Patient Name]', '[Month]', '[Date]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'hsa_summary',
    label: 'HSA Summary',
    messageType: 'HSA Summary',
    captureScreen: 'REPORT SHEET',
    activity: 'HSA SUMMARY',
    content: 'Dear [Patient Name] Your HSA Summary for the month of [Month], on [Date] is attached herewith.',
    variables: ['[Patient Name]', '[Month]', '[Date]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
  {
    id: 'sf_summary',
    label: 'SF Summary',
    messageType: 'SF Summary',
    captureScreen: 'REPORT SHEET',
    activity: 'SF SUMMARY',
    content: 'Dear [Patient Name] Your SF Summary for the month of [Month], on [Date] is attached herewith.',
    variables: ['[Patient Name]', '[Month]', '[Date]'],
    channels: { sms: true, whatsapp: true, email: true },
  },
];

export const DEFAULT_TEMPLATE_LABEL = 'Appointment (STPL Approved)';

export function getSmsTemplate(label: string): SmsTemplate | undefined {
  return SMS_TEMPLATES.find((t) => t.label === label);
}
