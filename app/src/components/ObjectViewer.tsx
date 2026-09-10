import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, Lightformer } from '@react-three/drei';
import { useGameStore } from '../lib/store';
import StageCaption from './StageCaption';
import * as THREE from 'three';

interface ObjectViewerProps {
  visualProfile: string;
}

/**
 * Motion model: the store holds *targets* (rotation, zoom, tier). Nothing snaps.
 * Every frame we damp the live values toward the targets, so an agent's
 * `rotate_object("y", 30)` reads as the object turning, not teleporting.
 */
const DAMP_ROTATION = 6;   // higher = snappier; ~0.35s to settle
const DAMP_CAMERA = 4;
const DAMP_MATERIAL = 2.5; // slower on purpose: the reveal should read as lights coming up (~1s)
const WIN_SPIN_MS = 1400;

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal tiers as material looks (tokens from the style lock)
const TIER_LOOK = [
  { color: '#1A1A1A', roughness: 1.0, metalness: 0.0 },  // silhouette
  { color: '#B8AFA3', roughness: 0.7, metalness: 0.1 },  // clay
  { color: '#D9D2C8', roughness: 0.5, metalness: 0.05 }, // light clay
  { color: '#EBE6DF', roughness: 0.4, metalness: 0.08 }, // studio
];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function SceneObject({ visualProfile }: { visualProfile: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const targetColor = useRef(new THREE.Color(TIER_LOOK[0].color));
  const winSpinStart = useRef<number | null>(null);
  const prevWon = useRef(false);

  useFrame((_, delta) => {
    const s = useGameStore.getState();
    const mesh = meshRef.current;
    const mat = materialRef.current;
    if (!mesh || !mat) return;

    const snap = reducedMotion();
    const dt = Math.min(delta, 0.1);

    // Victory lap: one smooth extra turn when the round is won
    if (s.won && !prevWon.current) winSpinStart.current = performance.now();
    prevWon.current = s.won;
    let spin = 0;
    if (winSpinStart.current !== null && !snap) {
      const t = Math.min((performance.now() - winSpinStart.current) / WIN_SPIN_MS, 1);
      spin = easeOutCubic(t) * Math.PI * 2;
      if (t >= 1) {
        winSpinStart.current = null;
        spin = 0;
      }
    }

    const tx = THREE.MathUtils.degToRad(s.rotationX);
    const ty = THREE.MathUtils.degToRad(s.rotationY) + spin;
    const tz = THREE.MathUtils.degToRad(s.rotationZ);
    if (snap) {
      mesh.rotation.set(tx, ty, tz);
    } else {
      mesh.rotation.x = THREE.MathUtils.damp(mesh.rotation.x, tx, DAMP_ROTATION, dt);
      mesh.rotation.y = THREE.MathUtils.damp(mesh.rotation.y, ty, DAMP_ROTATION, dt);
      mesh.rotation.z = THREE.MathUtils.damp(mesh.rotation.z, tz, DAMP_ROTATION, dt);
    }

    // Reveal tier crossfade
    const look = TIER_LOOK[Math.min(s.revealTier, TIER_LOOK.length - 1)];
    targetColor.current.set(look.color);
    if (snap) {
      mat.color.copy(targetColor.current);
      mat.roughness = look.roughness;
      mat.metalness = look.metalness;
    } else {
      const k = 1 - Math.exp(-DAMP_MATERIAL * dt);
      mat.color.lerp(targetColor.current, k);
      mat.roughness = THREE.MathUtils.damp(mat.roughness, look.roughness, DAMP_MATERIAL, dt);
      mat.metalness = THREE.MathUtils.damp(mat.metalness, look.metalness, DAMP_MATERIAL, dt);
    }
  });

  // Procedural geometry uses opaque profiles so answer names never enter UI state.
  const getGeometry = () => {
    if (visualProfile === 'p01') return <boxGeometry args={[1, 1.5, 1]} />;
    if (visualProfile === 'p06') return <boxGeometry args={[2, 0.2, 1.5]} />;
    if (visualProfile === 'p04') return <cylinderGeometry args={[0.3, 0.5, 1.5, 16]} />;
    if (visualProfile === 'p11') return <boxGeometry args={[2.5, 0.3, 0.8]} />;
    if (visualProfile === 'p03') return <cylinderGeometry args={[0.5, 0.6, 1, 32]} />;
    if (visualProfile === 'p08') return <sphereGeometry args={[0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />;
    if (visualProfile === 'p10') return <capsuleGeometry args={[0.15, 1.2, 8, 16]} />;
    if (visualProfile === 'p02') return <torusGeometry args={[1, 0.3, 16, 100]} />;
    if (visualProfile === 'p09') return <boxGeometry args={[2, 0.8, 1.2]} />;
    if (visualProfile === 'p05') return <capsuleGeometry args={[0.2, 1, 8, 16]} />;
    if (visualProfile === 'p12') return <boxGeometry args={[0.15, 1, 0.05]} />;
    if (visualProfile === 'p07') return <boxGeometry args={[0.4, 0.8, 0.08]} />;
    return <boxGeometry args={[1, 1, 1]} />;
  };

  return (
    <mesh ref={meshRef} rotation={[THREE.MathUtils.degToRad(15), THREE.MathUtils.degToRad(30), 0]} castShadow receiveShadow>
      {getGeometry()}
      <meshStandardMaterial ref={materialRef} color={TIER_LOOK[0].color} roughness={1} metalness={0} />
    </mesh>
  );
}

/**
 * Light studio with warm gallery presentation.
 * Key/ambient intensities ease between tiers, with a brief bloom when a tier unlocks.
 */
function StudioLighting() {
  const revealTier = useGameStore(state => state.revealTier);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const flashStart = useRef<number | null>(null);
  const prevTier = useRef(revealTier);

  useEffect(() => {
    if (revealTier > prevTier.current) flashStart.current = performance.now();
    prevTier.current = revealTier;
  }, [revealTier]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const ambientTarget = revealTier === 0 ? 0.2 : 0.3;
    const keyTarget = revealTier === 0 ? 0.3 : 0.8;

    // One 280ms ease-out pulse when a new tier unlocks: the "lights came up" moment
    let boost = 0;
    if (flashStart.current !== null && !reducedMotion()) {
      const t = Math.min((performance.now() - flashStart.current) / 280, 1);
      boost = (1 - easeOutCubic(t)) * 0.6;
      if (t >= 1) flashStart.current = null;
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.damp(ambientRef.current.intensity, ambientTarget, DAMP_MATERIAL, dt);
    }
    if (keyRef.current) {
      keyRef.current.intensity = THREE.MathUtils.damp(keyRef.current.intensity, keyTarget, DAMP_MATERIAL, dt) + boost;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.2} color="#f8f8f6" />

      <directionalLight
        ref={keyRef}
        position={[5, 6, 3]}
        intensity={0.3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {revealTier >= 1 && (
        <>
          <directionalLight position={[-3, 2, -3]} intensity={0.3} color="#dfe5ea" />
          <directionalLight position={[2, -1, 3]} intensity={0.15} color="#f0efed" />
        </>
      )}

      {revealTier >= 2 && (
        <Environment preset="studio" background={false}>
          <Lightformer intensity={0.3} position={[0, 5, -5]} scale={[10, 5, 1]} form="rect" color="#ffffff" />
          <Lightformer intensity={0.2} position={[0, -5, 5]} scale={[10, 3, 1]} form="rect" color="#f8f8f6" />
          <Lightformer intensity={0.15} position={[-8, 0, 0]} rotation-y={Math.PI / 2} scale={[8, 8, 1]} form="circle" color="#ededeb" />
        </Environment>
      )}
    </>
  );
}

/** Camera dolly: eases toward the distance for the current zoom level. */
function DollyCamera() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  useFrame((_, delta) => {
    const cam = cameraRef.current;
    if (!cam) return;
    const target = 5 - useGameStore.getState().zoomLevel * 0.8; // 5 -> 4.2 -> 3.4 -> 2.6
    cam.position.z = reducedMotion()
      ? target
      : THREE.MathUtils.damp(cam.position.z, target, DAMP_CAMERA, Math.min(delta, 0.1));
  });
  return <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 5]} fov={50} />;
}

export default function ObjectViewer({ visualProfile }: ObjectViewerProps) {
  const zoomLevel = useGameStore(state => state.zoomLevel);
  const revealTier = useGameStore(state => state.revealTier);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        style={{ background: 'var(--stage-bg)' }}
      >
        <DollyCamera />
        <StudioLighting />
        <SceneObject visualProfile={visualProfile} />

        <ContactShadows
          position={[0, -1, 0]}
          opacity={revealTier === 0 ? 0.15 : 0.3}
          scale={10}
          blur={3}
          far={4}
          color="#1A1A1A"
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false} // Rotation is driven by tools, not the mouse
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />

        {/* Infinity cyclorama backdrop */}
        <mesh position={[0, 0, -8]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#EDEDEB" roughness={1} />
        </mesh>
      </Canvas>

      <div style={{
        position: 'absolute',
        top: 'var(--space-3)',
        right: 'var(--space-3)',
        background: 'var(--surface)',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-ui)',
        fontWeight: 500,
        color: 'var(--ink-tertiary)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-subtle)',
      }}>
        Zoom {zoomLevel + 1}/4 · Reveal {revealTier + 1}/4
      </div>
      <StageCaption />
    </div>
  );
}
