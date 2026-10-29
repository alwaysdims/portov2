import { memo } from 'react';
import Village from './Village.jsx';
import KopdesExterior from './KopdesExterior.jsx';
import KopdesInterior from './KopdesInterior.jsx';
import EnvironmentColliders from './EnvironmentColliders.jsx';
import { ANCHORS } from './config.js';

const Environment = memo(function Environment() {
  return <group name="desa-a">
    <Village /><KopdesExterior /><KopdesInterior /><EnvironmentColliders />
    {/* Named floor anchors only; interaction sensors and gameplay belong to later checkpoints. */}
    <group name="gameplay-anchors">
      {ANCHORS.map(anchor => <group key={anchor.id} name={anchor.id} position={anchor.position} userData={anchor} />)}
    </group>
  </group>;
});

export default Environment;
