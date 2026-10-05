import { redirect } from 'next/navigation';

export default async function CycleRetrievalPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  redirect(`/cycle/entry${cycleId ? `?cycleId=${encodeURIComponent(cycleId)}` : ''}`);
}
