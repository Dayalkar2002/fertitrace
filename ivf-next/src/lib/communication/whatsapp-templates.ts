export type WhatsAppParamKey = 'patient' | 'doctor' | 'procedure' | 'datetime' | 'month' | 'date';

export type WhatsAppTemplateStatus = 'approved' | 'pending';

export interface WhatsAppTemplateDef {
  name: string;
  params: WhatsAppParamKey[];
  status: WhatsAppTemplateStatus;
}

/** Nukelite template catalog. Every name here is Meta-approved. */
export const WHATSAPP_TEMPLATES: WhatsAppTemplateDef[] = [
  { name: 'appointment_booked', params: ['patient', 'doctor', 'procedure', 'datetime'], status: 'approved' },
  { name: 'appointment_reschedule', params: ['patient', 'doctor', 'procedure', 'datetime'], status: 'approved' },
  { name: 'appointment_cancel', params: ['patient', 'doctor', 'datetime'], status: 'approved' },
  { name: 'injection_appointment', params: ['patient', 'procedure', 'datetime'], status: 'approved' },
  { name: 'iui_appointment', params: ['patient', 'procedure', 'datetime'], status: 'approved' },
  { name: 'iui_summary', params: ['patient', 'month', 'date'], status: 'approved' },
  { name: 'fm_procedure', params: ['patient', 'datetime'], status: 'approved' },
  { name: 'fm_blood_pink', params: ['patient', 'datetime'], status: 'approved' },
  { name: 'fm_blood_yellow', params: ['patient', 'datetime'], status: 'approved' },
  { name: 'fm_blood_d9', params: ['patient', 'datetime'], status: 'approved' },
  { name: 'hcg_injection', params: ['patient', 'datetime'], status: 'approved' },
  { name: 'pre_operative_instruction', params: ['patient', 'datetime', 'procedure'], status: 'approved' },
  { name: 'post_operative_instruction', params: ['patient', 'datetime'], status: 'approved' },
  { name: 'et_procedure', params: ['patient', 'procedure', 'datetime'], status: 'approved' },
  { name: 'ivf_summary', params: ['patient', 'date'], status: 'approved' },
  { name: 'bhcg_blood_test', params: ['patient', 'datetime'], status: 'approved' },
  { name: 'sqa_test', params: ['patient', 'datetime'], status: 'approved' },
  { name: 'sa_test', params: ['patient', 'datetime'], status: 'approved' },
  { name: 'sf_test', params: ['patient', 'datetime'], status: 'approved' },
  { name: 'sqa_summary', params: ['patient', 'month', 'date'], status: 'approved' },
  { name: 'hsa_summary', params: ['patient', 'month', 'date'], status: 'approved' },
  { name: 'sf_summary', params: ['patient', 'month', 'date'], status: 'approved' },
];

export const APPROVED_WHATSAPP_TEMPLATES = WHATSAPP_TEMPLATES.filter((item) => item.status === 'approved').map(
  (item) => item.name
);

export const PENDING_WHATSAPP_TEMPLATES = WHATSAPP_TEMPLATES.filter((item) => item.status === 'pending').map(
  (item) => item.name
);

export function getWhatsAppTemplateDef(name?: string): WhatsAppTemplateDef | undefined {
  const value = (name || '').trim().toLowerCase();
  return WHATSAPP_TEMPLATES.find((item) => item.name === value);
}

export function isWhatsAppTemplateApproved(name?: string): boolean {
  return getWhatsAppTemplateDef(name)?.status === 'approved';
}

export function isKnownWhatsAppTemplate(name?: string): boolean {
  return Boolean(getWhatsAppTemplateDef(name));
}
