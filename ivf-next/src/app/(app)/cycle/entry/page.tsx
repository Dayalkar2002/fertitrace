import { Suspense } from 'react';
import { CycleEntryForm } from '@/components/cycle-entry-form';

export default function CycleEntryPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs text-slate-500">Loading cycle retrieval…</div>}>
      <CycleEntryForm />
    </Suspense>
  );
}
