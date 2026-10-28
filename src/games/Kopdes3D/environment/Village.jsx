import { Boxes, Foliage, Roof, Sign } from './Props.jsx';
import { ROOFS, SHRUBS, TREES, VILLAGE_BOXES } from './config.js';

export default function Village() {
  return <group name="village">
    <Boxes items={VILLAGE_BOXES} />
    <Roof {...ROOFS[0]} />
    <Foliage positions={TREES} /><Foliage positions={SHRUBS} shrubs />
    <Sign text="RUMAH OWI" position={[0, 2.55, 1.17]} width={2.2} height={0.32} rotation={[0, 0, 0]} />
    <Sign text="WARUNG DESA" position={[-7.5, 2.2, 3.48]} width={2.8} height={0.4} />
    <Sign text="KOPDES · SELAMAT DATANG" position={[0, 3.5, 24.73]} width={9} height={0.38} />
  </group>;
}
