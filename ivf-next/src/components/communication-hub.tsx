'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { InternalAlarms } from '@/components/internal-alarms';
import { PatientCommunication } from '@/components/patient-communication';

export function CommunicationHub() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('tab') === 'alarms' ? 'alarms' : 'messages';

  function setTab(next: 'messages' | 'alarms') {
    router.replace(next === 'alarms' ? '/communication?tab=alarms' : '/communication');
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 pb-10">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('messages')}
          className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
            tab === 'messages' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'
          }`}
        >
          Patient messages
        </button>
        <button
          type="button"
          onClick={() => setTab('alarms')}
          className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
            tab === 'alarms' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'
          }`}
        >
          Internal alarms
        </button>
      </div>
      {tab === 'alarms' ? <InternalAlarms /> : <PatientCommunication />}
    </div>
  );
}
