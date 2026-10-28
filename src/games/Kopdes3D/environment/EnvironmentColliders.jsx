import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { ENVIRONMENT_COLLIDERS } from './config.js';

export default function EnvironmentColliders() {
  return <RigidBody type="fixed" colliders={false}>
    {ENVIRONMENT_COLLIDERS.map(({ id, position, size }) =>
      <CuboidCollider key={id} name={id} position={position} args={size.map(n => n / 2)} />)}
  </RigidBody>;
}
