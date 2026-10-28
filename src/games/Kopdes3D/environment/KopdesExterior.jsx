import { Boxes, Roof, Sign } from './Props.jsx';
import { EXTERIOR_BOXES, ROOFS } from './config.js';

export default function KopdesExterior() {
  return <group name="kopdes-exterior">
    <Boxes items={EXTERIOR_BOXES} />
    <Roof {...ROOFS[1]} />
    <Sign text="KOPDES MERAH PUTIH" position={[0, 4.35, 27.53]} width={11} height={0.65} />
    <Sign text="MASUK" position={[0, 3.37, 25.48]} width={2} height={0.3} />
  </group>;
}
