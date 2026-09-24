import { SmartCardClient } from '@/components/smartcard/smart-card-client';

export const metadata = {
  title: 'Smart Card & Access Management | FERTITRACE IVF',
  description: 'Cleanroom biometric identity, patient couple tokens and high-security laboratory zone access management',
};

export default function SmartCardPage() {
  return <SmartCardClient />;
}
