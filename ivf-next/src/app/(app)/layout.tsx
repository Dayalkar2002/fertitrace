'use client';

import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';
import { ScreenSkeletonLoader } from '@/components/screen-skeleton-loader';
import { PatientProvider } from '@/contexts/patient-context';

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PatientProvider>
        <AppShell>{children}</AppShell>
      </PatientProvider>
    </RequireAuth>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <ScreenSkeletonLoader />
        </div>
      }
    >
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  );
}
