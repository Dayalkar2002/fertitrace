import { MediaManagementClient } from '@/components/media/media-management-client';

export const metadata = {
  title: 'Media Module | FERTITRACE IVF',
  description: 'Manage and categorize cycle embryology images, procedure media, shared library assets, and printable photo reports.',
};

export default function MediaPage() {
  return <MediaManagementClient />;
}
