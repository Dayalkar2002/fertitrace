import { LabInventoryClient } from '@/components/inventory/lab-inventory-client';

export const metadata = {
  title: 'Lab Inventory & Reagents | FERTITRACE IVF',
  description: 'IVF laboratory media, culture reagents, consumables inventory, cold-chain telemetry and cycle-to-batch traceability',
};

export default function InventoryPage() {
  return <LabInventoryClient />;
}
