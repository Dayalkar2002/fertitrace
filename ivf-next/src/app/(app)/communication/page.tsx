import { Suspense } from 'react';
import { CommunicationHub } from '@/components/communication-hub';

export default function CommunicationPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading communication…</div>}>
      <CommunicationHub />
    </Suspense>
  );
}
