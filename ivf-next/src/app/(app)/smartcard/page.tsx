import { Suspense } from 'react';
import { SmartCardClient } from '@/components/smartcard/smart-card-client';

export const metadata = {
  title: 'Smart Card & Access Management | FERTITRACE IVF',
  description: 'Cleanroom biometric identity, patient couple tokens and high-security laboratory zone access management',
};

export default function SmartCardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-medium">Loading Smart Card Studio...</div>}>
      <SmartCardClient />
    </Suspense>
  );
}

