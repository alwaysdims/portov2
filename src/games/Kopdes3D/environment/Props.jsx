import { useLayoutEffect, useRef } from 'react';
import { CanvasTexture, Object3D, SRGBColorSpace } from 'three';

function BoxBatch({ items, color }) {
  const mesh = useRef(null);
  useLayoutEffect(() => {
    const transform = new Object3D();
    items.forEach((item, index) => {
      transform.position.set(...item.position);
      transform.scale.set(...item.size);
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, items.length]} receiveShadow>
    <boxGeometry /><meshStandardMaterial color={color} roughness={0.9} />
  </instancedMesh>;
}

export function Boxes({ items }) {
  const colors = [...new Set(items.map(item => item.color))];
  return colors.map(color => <BoxBatch key={color} color={color} items={items.filter(item => item.color === color)} />);
}

export function Sign({ text, position, width = 3, height = 0.5, rotation = [0, Math.PI, 0], color = '#a92f2b' }) {
  const material = useRef(null);
  useLayoutEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff4df';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font = 'bold 60px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 512, 64, 980);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    const target = material.current;
    target.map = texture;
    target.needsUpdate = true;
    return () => { target.map = null; texture.dispose(); };
  }, [text, color]);
  return <mesh position={position} rotation={rotation}>
    <planeGeometry args={[width, height]} /><meshBasicMaterial ref={material} toneMapped={false} />
  </mesh>;
}

export function Roof({ position, width, depth, height }) {
  return <group position={position} scale={[width / Math.SQRT2, 1, depth / Math.SQRT2]}>
    <mesh rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[1, height, 4]} /><meshStandardMaterial color="#a95c43" flatShading />
    </mesh>
  </group>;
}

export function Foliage({ positions, shrubs = false }) {
  const mesh = useRef(null);
  useLayoutEffect(() => {
    const transform = new Object3D();
    positions.forEach(([x, y, z], index) => {
      transform.position.set(x, y + (shrubs ? 0 : 3), z);
      transform.scale.setScalar(shrubs ? 0.6 : 1.5);
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [positions, shrubs]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, positions.length]}>
    <icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color={shrubs ? '#637e46' : '#507c49'} flatShading />
  </instancedMesh>;
}
