export default function Lighting() {
  return <>
    <color attach="background" args={['#c7dedc']} />
    <hemisphereLight args={['#fff1d0', '#7b8866', 2]} />
    <ambientLight intensity={0.5} />
    <directionalLight position={[-10, 24, 8]} intensity={2.2} color="#ffe1af" castShadow
      shadow-mapSize={[1024, 1024]} shadow-bias={-0.001}
      shadow-camera-left={-28} shadow-camera-right={28}
      shadow-camera-top={50} shadow-camera-bottom={-30} shadow-camera-far={100} />
    {/* Daylight plus ceiling panels: no per-fixture dynamic lights or shadows. */}
  </>;
}
