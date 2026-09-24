import { buildParams, executeDRL } from '@/lib/db/spExecutor';
import { rowNum, rowVal } from '@/lib/db/row';
import { getDonorLockedRecipientPatId } from '@/lib/services-server/patient.service';

export interface RetrievalPerson {
  id: number;
  name: string;
}

export interface RetrievalCycleOption {
  id: string;
  label: string;
}

/** SMART Cycle.aspx GetRetrivalCycle → spGetCycIds. Query 2 = recipient names, query 1 = that patient's cycles. */
export async function listRetrievalRecipients(patId: number, satId: number, cycleId: string) {
  const lockedRecipientId = await getDonorLockedRecipientPatId(patId).catch(() => 0);
  const result = await executeDRL<Record<string, unknown>>(
    'spGetCycIds',
    buildParams('@CycId,@PatID,@QueryIndex,@SatId', [cycleId || '', patId, 2, satId || 0])
  );
  const recipients: RetrievalPerson[] = [];
  for (const row of result.recordset || []) {
    const id = rowNum(row, 'PatId', 'PatID');
    const name = rowVal(row, 'PatName', 'Name');
    if (!id || !name) continue;
    if (lockedRecipientId > 0 && id !== lockedRecipientId) continue;
    recipients.push({ id, name });
  }
  return { lockedRecipientId, recipients };
}

export async function listRecipientCycles(recipientId: number, satId: number, cycleId: string): Promise<RetrievalCycleOption[]> {
  const result = await executeDRL<Record<string, unknown>>(
    'spGetCycIds',
    buildParams('@CycId,@PatID,@QueryIndex,@SatId', [cycleId || '', recipientId, 1, satId || 0])
  );
  return (result.recordset || [])
    .map((row) => {
      const id = rowVal(row, 'CycID', 'CycId');
      if (!id) return null;
      const rawDate = row.CycODate ?? row.CycDate;
      const date = rawDate ? new Date(String(rawDate)) : null;
      const label =
        date && !Number.isNaN(date.getTime())
          ? `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (${id})`
          : id;
      return { id, label };
    })
    .filter((row): row is RetrievalCycleOption => row !== null);
}
