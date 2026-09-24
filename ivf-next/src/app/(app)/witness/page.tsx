import { WitnessSystemClient } from '@/components/witness/witness-system-client';

export const metadata = {
  title: 'Witness System (RFID / EWS) | FERTITRACE IVF',
  description: 'Electronic Witnessing System, dual-verification and gamete mismatch shield compliant with ART Act 2022',
};

export default function WitnessPage() {
  return <WitnessSystemClient />;
}
