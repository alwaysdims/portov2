import { Boxes, Sign } from './Props.jsx';
import { INTERIOR_BOXES, SHELVES } from './config.js';

export default function KopdesInterior() {
  return <group name="kopdes-interior">
    <Boxes items={INTERIOR_BOXES} />
    {SHELVES.map(shelf => <Sign key={shelf.id} text={shelf.label}
      position={[shelf.position[0], shelf.size[1] + 0.25, shelf.position[2] - shelf.size[2] / 2 - 0.08]}
      width={shelf.id === 'rice' ? 2.4 : 2.8} height={0.35} />)}
    <Sign text="KASIR · ANTRE DI SINI" position={[4.5, 2.2, 37.1]} width={3} height={0.4} />
    <Sign text="PENYIMPANAN" position={[7, 2.3, 37.32]} width={1.3} height={0.25} />
  </group>;
}
