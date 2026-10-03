import { Suspense } from 'react';
import { OocyteEmbryoClient } from '@/components/oocyte-embryo/oocyte-embryo-client';

export const metadata = {
  title: 'Oocyte & Embryo Management | FERTITRACE',
  description: 'Oocyte retrieval, fertilization assessment, embryo culture grading, and cryopreservation tracking with full witnessing and audit trail.',
};

export default function OocyteEmbryoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-semibold text-slate-500">Loading Oocyte &amp; Embryo management…</div>}>
      <OocyteEmbryoClient />
    </Suspense>
  );
}
