import {
  APPROVED_WHATSAPP_TEMPLATES,
  getWhatsAppTemplateDef,
  isKnownWhatsAppTemplate,
  type WhatsAppParamKey,
} from '@/lib/communication/whatsapp-templates';

type WhatsAppSendPayload = {
  patientName: string;
  recipient: string;
  messageType: string;
  messageText: string;
  whatsappTemplate?: string;
};

const DEFAULT_TEMPLATE = 'appointment_booked';
const DEFAULT_LANGUAGE = 'en_US';
const V5_BROADCAST_URL = 'https://wa20.nuke.co.in/v5/api/index.php/addbroadcast';

type NukeliteJson = {
  success?: boolean;
  message?: string;
  error?: string;
  status?: string | number;
  request_id?: string;
  skipped?: number;
};

function env(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

export function nukeliteConfigured(): boolean {
  return Boolean(env('NUKELITE_USERNAME') && (env('NUKELITE_JWT') || env('NUKELITE_API_KEY') || env('WHATSAPP_API_KEY')));
}

function toE164India(recipient: string): string {
  const digits = recipient.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(-10)}`;
  return `91${digits.slice(-10)}`;
}

/** Campaign API validates CSV-style rows. A bare digit string is treated as a headerless upload. */
function campaignNumberRow(payload: WhatsAppSendPayload, params: string[]) {
  const phone = toE164India(payload.recipient);
  const name = payload.patientName.replace(/^Mrs\.?\s+/i, '').trim() || 'Patient';
  return {
    phone,
    mobile: phone,
    number: phone,
    name,
    var1: params[0] || name,
    var2: params[1] || '',
    var3: params[2] || '',
    var4: params[3] || '',
  };
}

function approvedTemplateNames(): Set<string> {
  const names = new Set<string>(APPROVED_WHATSAPP_TEMPLATES);
  env('NUKELITE_APPROVED_TEMPLATES')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .forEach((item) => names.add(item));
  return names;
}

function resolveTemplateName(payload: WhatsAppSendPayload): string {
  const explicit = env('NUKELITE_DEFAULT_TEMPLATE') || DEFAULT_TEMPLATE;
  const fromPayload = payload.whatsappTemplate?.trim().toLowerCase();
  if (fromPayload && isKnownWhatsAppTemplate(fromPayload)) return fromPayload;

  const type = (payload.messageType || '').toLowerCase();
  const text = (payload.messageText || '').toLowerCase();
  if (type.includes('reschedule')) return 'appointment_reschedule';
  if (type.includes('cancel')) return 'appointment_cancel';
  if (type.includes('injection') && !type.includes('hcg')) return 'injection_appointment';
  if (type.includes('iui') && type.includes('summary')) return 'iui_summary';
  if (type.includes('iui')) return 'iui_appointment';
  if (type.includes('hcg')) return 'hcg_injection';
  if (type.includes('pre operative') || type.includes('pre-operative')) return 'pre_operative_instruction';
  if (type.includes('post operative') || type.includes('post-operative')) return 'post_operative_instruction';
  if (type.includes('et procedure') || type.includes('embryo')) return 'et_procedure';
  if (type.includes('ivf')) return 'ivf_summary';
  if (type.includes('bhcg')) return 'bhcg_blood_test';
  if (type.includes('sqa') && type.includes('summary')) return 'sqa_summary';
  if (type.includes('hsa') && type.includes('summary')) return 'hsa_summary';
  if (type.includes('sf') && type.includes('summary')) return 'sf_summary';
  if (type.includes('sqa')) return 'sqa_test';
  if (type.includes('sa test') || type === 'sa test') return 'sa_test';
  if (type.includes('sf test') || type === 'sf test') return 'sf_test';
  if (type.includes('fm & blood') || type.includes('blood test')) {
    if (text.includes('d9')) return 'fm_blood_d9';
    if (text.includes('yellow') || (text.includes('follicular monitoring') && !text.includes('blood'))) {
      return 'fm_blood_yellow';
    }
    return 'fm_blood_pink';
  }
  if (type.includes('fm')) return 'fm_procedure';
  if (type.includes('appointment') || type.includes('follow')) return 'appointment_booked';
  return explicit;
}

function extractFields(payload: WhatsAppSendPayload): Record<WhatsAppParamKey, string> {
  const patient = payload.patientName.replace(/^Mrs\.?\s+/i, '').trim() || 'Patient';
  const text = payload.messageText || '';
  const doctor =
    text.match(/with\s+(Dr\.?\s*[^,]+?)(?:\s+has been|\s+for|\s+at)/i)?.[1]?.trim() ||
    env('CONSENT_CONSULTANT1', 'Dr. Sanjay Kumar Pagare');
  const procedure =
    text.match(/Your\s+(.+?)\s+is scheduled/i)?.[1]?.trim() ||
    text.match(/booked for\s+(.+?)\s+on\s+/i)?.[1]?.trim() ||
    text.match(/admitted on\s+.+?\s+for\s+(.+?)\s+at\s+/i)?.[1]?.trim() ||
    text.match(/for\s+(.+?)\s+at\s+/i)?.[1]?.trim() ||
    'Consultation';
  const datetime =
    text.match(/due on\s+(.+?)(?:\.|$)/i)?.[1]?.trim() ||
    text.match(/on\s+(.+?)\s+has been cancelled/i)?.[1]?.trim() ||
    text.match(/Andheri on\s+(.+?),/i)?.[1]?.trim() ||
    text.match(/\b(?:on|On)\s+(\d{1,2}\s+\w{3}\s+\d{4}(?:\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM))?)/)?.[1]?.trim() ||
    text.match(/\bon\s+(.+?)(?:\.|$)/i)?.[1]?.trim() ||
    '';
  const month = text.match(/month of\s+([^,\.]+)/i)?.[1]?.trim() || '';
  const date =
    text.match(/month of\s+[^,]+,\s+on\s+(.+?)(?:\s+is attached|\.|$)/i)?.[1]?.trim() ||
    text.match(/month of\s+(.+?)\s+is attached/i)?.[1]?.trim() ||
    text.match(/\b(\d{1,2}\s+\w{3}\s+\d{4})\b/)?.[1]?.trim() ||
    datetime;
  return { patient, doctor, procedure, datetime, month, date };
}

function bodyParameters(payload: WhatsAppSendPayload, templateName: string): string[] {
  const fields = extractFields(payload);
  const keys = getWhatsAppTemplateDef(templateName)?.params || (['patient', 'doctor', 'procedure', 'datetime'] as WhatsAppParamKey[]);
  return keys.map((key) => fields[key] || '');
}

function authToken(): string {
  return env('NUKELITE_JWT') || env('NUKELITE_API_KEY') || env('WHATSAPP_API_KEY');
}

function permanentApiKey(): string {
  const key = env('NUKELITE_API_KEY') || env('WHATSAPP_API_KEY');
  return key && !isJwt(key) ? key : '';
}

function isJwt(token: string): boolean {
  return token.startsWith('eyJ');
}

function describeError(data: NukeliteJson, fallback: string, status: number, templateName = ''): string {
  const raw = String(data.message || data.error || fallback);
  const username = env('NUKELITE_USERNAME', 'teamivfcraft');
  if (status === 409 || /pending/i.test(raw)) {
    return 'WhatsApp template is still pending Meta approval. Send from Fertitrace after status becomes Approved.';
  }
  if (/rejected/i.test(raw)) {
    return 'WhatsApp template was rejected by Meta. Fix the template in Nukelite and resubmit.';
  }
  if (/insufficient/i.test(raw)) {
    return 'Nukelite has no utility WhatsApp credits for this send.';
  }
  if (status === 401 || (status === 400 && /auth/i.test(raw))) {
    return 'Nukelite API token is missing or invalid. Copy the API key from Nukelite Dashboard / Profile.';
  }
  if (/username missing/i.test(raw)) {
    return 'Nukelite Dashboard API Key is required for broadcast send. Copy the API Key from Nukelite Dashboard (not the login JWT) into NUKELITE_API_KEY.';
  }
  if (/template not found/i.test(raw) || /no whatsapp account/i.test(raw)) {
    return `Nukelite could not send "${templateName || 'appointment_booked'}" for ${username}. The template is approved in the portal, but this send call cannot see it.`;
  }
  if (/no valid mobile|malformed rows/i.test(raw)) {
    return 'Nukelite rejected the recipient as a campaign upload row. Fertitrace now sends the mobile as a phone/name row (91 + 10 digits).';
  }
  return raw;
}

function tlsInsecure(): boolean {
  return env('NUKELITE_TLS_INSECURE', 'true') !== 'false';
}

function wrapNetworkError(err: unknown): Error {
  const cause = err instanceof Error ? (err as Error & { cause?: Error }).cause : undefined;
  const detail = String(cause?.message || (err instanceof Error ? err.message : err));
  if (/certificate|UNABLE_TO_VERIFY|CERT/i.test(detail)) {
    return new Error('Could not verify Nukelite SSL certificate. Set NUKELITE_TLS_INSECURE=true in .env.local.');
  }
  if (detail === 'fetch failed' || /fetch failed/i.test(detail)) {
    return new Error('Could not reach Nukelite WhatsApp API. Check internet access to wa20.nuke.co.in.');
  }
  return err instanceof Error ? err : new Error(detail);
}

async function nukeliteJson(
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string }
): Promise<{ ok: boolean; status: number; data: NukeliteJson }> {
  if (!tlsInsecure()) {
    try {
      const res = await fetch(url, init);
      const data = (await res.json().catch(() => ({}))) as NukeliteJson;
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      throw wrapNetworkError(err);
    }
  }

  const https = await import('node:https');
  const { URL } = await import('node:url');
  const parsed = new URL(url);
  const payload = init.body;
  const headers = { ...init.headers };
  if (payload !== undefined) headers['Content-Length'] = String(Buffer.byteLength(payload));

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: init.method,
        headers,
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk as Buffer));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let data: NukeliteJson = {};
          try {
            data = text ? (JSON.parse(text) as NukeliteJson) : {};
          } catch {
            data = { message: text.slice(0, 300) };
          }
          const status = res.statusCode || 500;
          resolve({ ok: status < 400, status, data });
        });
      }
    );
    req.on('error', (err) => reject(wrapNetworkError(err)));
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}

async function dispatchViaV6(payload: WhatsAppSendPayload, token: string, templateName: string, params: string[]): Promise<void> {
  const username = env('NUKELITE_USERNAME', 'teamivfcraft');
  const endpoint =
    env('NUKELITE_API_URL') ||
    `https://wa20.nuke.co.in/v6/api/whatsappTemplate/24/${encodeURIComponent(username)}/messages`;
  const language = env('NUKELITE_LANGUAGE', DEFAULT_LANGUAGE);
  const to = toE164India(payload.recipient);

  const { ok, status, data } = await nukeliteJson(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: [
          {
            type: 'body',
            parameters: params.map((text) => ({ type: 'text', text })),
          },
        ],
      },
    }),
  });

  if (!ok || data.success === false || data.status === 'failed' || data.error) {
    throw new Error(describeError(data, `Nukelite WhatsApp failed (${status}).`, status, templateName));
  }
}

async function dispatchViaV5(payload: WhatsAppSendPayload, token: string, templateName: string, params: string[]): Promise<void> {
  const endpoint = env('NUKELITE_V5_URL', V5_BROADCAST_URL);
  const to = toE164India(payload.recipient);
  const service = env('NUKELITE_BROADCAST_SERVICE', 'utility_credits');
  const body: Record<string, string> = {
    username: env('NUKELITE_USERNAME', 'teamivfcraft'),
    brodcast_service: service,
    broadcast_name: payload.messageType || templateName,
    template_id: templateName,
    contacts: to,
    broadcast_message: '',
    attribute1: params[0] || '',
    attribute2: params[1] || '',
    attribute3: params[2] || '',
    attribute4: params[3] || '',
  };

  const { ok, status, data } = await nukeliteJson(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify(body),
  });

  const passed = ok && data.success !== false && String(data.message || '').toLowerCase() !== 'error';
  if (!passed || data.error) {
    throw new Error(describeError(data, `Nukelite WhatsApp failed (${status}).`, status, templateName));
  }
}

async function portalSenderNumber(token: string): Promise<string> {
  const configured = env('NUKELITE_BROADCAST_NUMBER').replace(/\D/g, '');
  if (configured) return configured;

  const { ok, data } = await nukeliteJson('https://nukelite.co.in/api/wa-settings/accounts', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const accounts =
    (data as NukeliteJson & { accounts?: { phone_number?: string; is_active?: boolean }[] }).accounts || [];
  const active = accounts.find((item) => item.is_active !== false && item.phone_number) || accounts[0];
  const number = String(active?.phone_number || '').replace(/\D/g, '');
  if (!ok || !number) {
    throw new Error('Nukelite has no active WhatsApp sender number on this account.');
  }
  return number;
}

/** Permanent API key. Same templates as the portal, without the login token. */
async function dispatchViaApiKey(
  payload: WhatsAppSendPayload,
  apiKey: string,
  templateName: string,
  params: string[]
): Promise<void> {
  const broadcastNumber = env('NUKELITE_BROADCAST_NUMBER').replace(/\D/g, '') || '919522534045';
  const { ok, status, data } = await nukeliteJson('https://nukelite.co.in/api/ext/wa-business/campaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      broadcastName: payload.messageType || templateName,
      broadcastNumber,
      template: templateName,
      category: 'UTILITY',
      numbers: [campaignNumberRow(payload, params)],
      bodyVariables: params,
      headerMediaUrl: '',
    }),
  });

  if (!ok || data.error || data.success === false) {
    throw new Error(describeError(data, `Nukelite WhatsApp failed (${status}).`, status, templateName));
  }
}

/** Same call the Nukelite Broadcasting screen uses. The wa20 template API does not see these records. */
async function dispatchViaPortal(
  payload: WhatsAppSendPayload,
  token: string,
  templateName: string,
  params: string[]
): Promise<void> {
  const broadcastNumber = await portalSenderNumber(token);
  const now = new Date();
  const { ok, status, data } = await nukeliteJson('https://nukelite.co.in/api/wa-broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      broadcastName: payload.messageType || templateName,
      broadcastNumber,
      templateId: '',
      category: 'UTILITY',
      message: '',
      headerMediaUrl: null,
      template: templateName,
      numbers: [campaignNumberRow(payload, params)],
      csvMode: 'bulk',
      scheduled: false,
      bodyVariables: params,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
    }),
  });

  if (!ok || data.error || data.success === false) {
    throw new Error(describeError(data, `Nukelite WhatsApp failed (${status}).`, status, templateName));
  }
}

export async function dispatchNukeliteWhatsApp(payload: WhatsAppSendPayload): Promise<void> {
  if (!nukeliteConfigured()) {
    throw new Error(
      'Nukelite WhatsApp is wired but the API key is missing. Open Nukelite Dashboard / Profile, copy the API key, and set NUKELITE_API_KEY in .env.local.'
    );
  }

  const token = authToken();
  const templateName = resolveTemplateName(payload);
  const params = bodyParameters(payload, templateName);

  if (!approvedTemplateNames().has(templateName.toLowerCase())) {
    throw new Error(
      `WhatsApp template "${templateName}" is not enabled for sending.`
    );
  }

  try {
    const apiKey = permanentApiKey();
    if (apiKey) {
      try {
        await dispatchViaApiKey(payload, apiKey, templateName, params);
        return;
      } catch (campaignErr) {
        const text = campaignErr instanceof Error ? campaignErr.message : String(campaignErr);
        if (/no valid mobile|malformed rows|campaign upload row/i.test(text) && isJwt(token)) {
          await dispatchViaPortal(payload, token, templateName, params);
          return;
        }
        throw campaignErr;
      }
    }
    if (isJwt(token)) {
      await dispatchViaPortal(payload, token, templateName, params);
      return;
    }
    if (env('NUKELITE_API_URL').includes('/v6/')) {
      try {
        await dispatchViaV6(payload, token, templateName, params);
        return;
      } catch (v6Err) {
        const text = v6Err instanceof Error ? v6Err.message : String(v6Err);
        if (/template not found|no whatsapp account/i.test(text) && env('NUKELITE_API_KEY') && !isJwt(env('NUKELITE_API_KEY'))) {
          await dispatchViaV5(payload, env('NUKELITE_API_KEY'), templateName, params);
          return;
        }
        throw v6Err;
      }
    }
    await dispatchViaV5(payload, token, templateName, params);
  } catch (err) {
    throw wrapNetworkError(err);
  }
}
