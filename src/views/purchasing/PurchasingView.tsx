import { usePos } from '../../store/PosContext';
import { GrTab } from './GrTab';
import { PoTab } from './PoTab';
import { PrTab } from './PrTab';
import { VendorTab } from './VendorTab';

export function PurchasingView() {
  const { procTab, hasPerm } = usePos();

  if (procTab === 'po') return <PoTab />;
  if (procTab === 'gr') return <GrTab />;
  if (procTab === 'vendor') return hasPerm('vendor') ? <VendorTab /> : null;
  return <PrTab />;
}
