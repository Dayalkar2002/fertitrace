import { InseminationEntryForm } from '@/components/insemination-entry-form';

export const metadata = {
  title: 'Insemination Entry (IVF / ICSI) | FertiTrace',
  description: 'Unified clinical entry for Conventional IVF and ICSI insemination and fertilization',
};

export default function InseminationPage() {
  return <InseminationEntryForm />;
}
