import { OocyteEmbryoClient } from '@/components/oocyte-embryo/oocyte-embryo-client';

export const metadata = {
  title: 'Oocyte & Embryo Management | FERTITRACE',
  description: 'Oocyte retrieval, fertilization assessment, embryo culture grading, and cryopreservation tracking with full witnessing and audit trail.',
};

export default function OocyteEmbryoPage() {
  return <OocyteEmbryoClient />;
}
