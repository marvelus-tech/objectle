import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, Lightformer } from '@react-three/drei';
import { useGameStore } from '../lib/store';
import * as THREE from 'three';
import StageCaption from './StageCaption';

interface ObjectViewerProps {
  visualProfile: string;
}

/**
 * The 3D object being displayed
 * Applies silhouette vs color rendering based on revealTier
 */
function SceneObject({ visualProfile }: { visualProfile: string }) {
  const revealTier = useGameStore(state => state.revealTier);
  const rotationX = useGameStore(state => state.rotationX);
  const rotationY = useGameStore(state => state.rotationY);
  const rotationZ = useGameStore(state => state.rotationZ);
  
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef(new THREE.Euler());
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  useEffect(() => {
    targetRotation.current.set(
      THREE.MathUtils.degToRad(rotationX),
      THREE.MathUtils.degToRad(rotationY),
      THREE.MathUtils.degToRad(rotationZ),
    );
    if (reduceMotion && meshRef.current) {
      meshRef.current.rotation.copy(targetRotation.current);
    }
  }, [reduceMotion, rotationX, rotationY, rotationZ]);

  useFrame((_, delta) => {
    if (!meshRef.current || reduceMotion) return;
    meshRef.current.rotation.x = THREE.MathUtils.damp(
      meshRef.current.rotation.x,
      targetRotation.current.x,
      8,
      delta,
    );
    meshRef.current.rotation.y = THREE.MathUtils.damp(
      meshRef.current.rotation.y,
      targetRotation.current.y,
      8,
      delta,
    );
    meshRef.current.rotation.z = THREE.MathUtils.damp(
      meshRef.current.rotation.z,
      targetRotation.current.z,
      8,
      delta,
    );
  });
  
  // Procedural geometry uses opaque profiles so answer names never enter UI state.
  // In production, this would load actual GLTF models from R2
  const getGeometry = () => {
    if (visualProfile === 'p01') {
      return <boxGeometry args={[1, 1.5, 1]} />;
    } else if (visualProfile === 'p06') {
      return <boxGeometry args={[2, 0.2, 1.5]} />;
    } else if (visualProfile === 'p04') {
      return <cylinderGeometry args={[0.3, 0.5, 1.5, 16]} />;
    } else if (visualProfile === 'p11') {
      return <boxGeometry args={[2.5, 0.3, 0.8]} />;
    } else if (visualProfile === 'p03') {
      return <cylinderGeometry args={[0.5, 0.6, 1, 32]} />;
    } else if (visualProfile === 'p08') {
      return <sphereGeometry args={[0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />;
    } else if (visualProfile === 'p10') {
      return <capsuleGeometry args={[0.15, 1.2, 8, 16]} />;
    } else if (visualProfile === 'p02') {
      return <torusGeometry args={[1, 0.3, 16, 100]} />;
    } else if (visualProfile === 'p09') {
      return <boxGeometry args={[2, 0.8, 1.2]} />;
    } else if (visualProfile === 'p05') {
      return <capsuleGeometry args={[0.2, 1, 8, 16]} />;
    } else if (visualProfile === 'p12') {
      return <boxGeometry args={[0.15, 1, 0.05]} />;
    } else if (visualProfile === 'p07') {
      return <boxGeometry args={[0.4, 0.8, 0.08]} />;
    }
    
    // Default
    return <boxGeometry args={[1, 1, 1]} />;
  };
  
  // Material changes based on reveal tier
  const getMaterial = () => {
    if (revealTier === 0) {
      // Silhouette: pure black (#1A1A1A from style lock)
      return <meshBasicMaterial color="#1A1A1A" />;
    } else if (revealTier === 1) {
      // Partial reveal: mid-tone clay
      return <meshStandardMaterial color="#B8AFA3" roughness={0.7} metalness={0.1} />;
    } else if (revealTier === 2) {
      // More detail: light clay
      return <meshStandardMaterial color="#D9D2C8" roughness={0.5} metalness={0.05} />;
    } else {
      // Full studio: detailed material with soft sheen
      return <meshStandardMaterial color="#EBE6DF" roughness={0.4} metalness={0.08} />;
    }
  };
  
  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      {getGeometry()}
      {getMaterial()}
    </mesh>
  );
}

/**
 * Light studio with warm gallery presentation
 * Progressive lighting that reveals more detail as revealTier increases
 */
function StudioLighting() {
  const revealTier = useGameStore(state => state.revealTier);
  
  return (
    <>
      {/* Soft ambient base */}
      <ambientLight intensity={revealTier === 0 ? 0.2 : 0.3} color="#f8f8f6" />
      
      {/* Key light: soft directional from top-right */}
      <directionalLight
        position={[5, 6, 3]}
        intensity={revealTier === 0 ? 0.3 : 0.8}
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
      
      {/* Fill lights - activated at tier 1+ for depth */}
      {revealTier >= 1 && (
        <>
          <directionalLight position={[-3, 2, -3]} intensity={0.3} color="#dfe5ea" />
          <directionalLight position={[2, -1, 3]} intensity={0.15} color="#f0efed" />
        </>
      )}
      
      {/* Studio environment and Lightformers for gallery polish (tier 2+) */}
      {revealTier >= 2 && (
        <Environment preset="studio" background={false}>
          <Lightformer
            intensity={0.3}
            position={[0, 5, -5]}
            scale={[10, 5, 1]}
            form="rect"
            color="#ffffff"
          />
          <Lightformer
            intensity={0.2}
            position={[0, -5, 5]}
            scale={[10, 3, 1]}
            form="rect"
            color="#f8f8f6"
          />
          <Lightformer
            intensity={0.15}
            position={[-8, 0, 0]}
            rotation-y={Math.PI / 2}
            scale={[8, 8, 1]}
            form="circle"
            color="#ededeb"
          />
        </Environment>
      )}
    </>
  );
}

export default function ObjectViewer({ visualProfile }: ObjectViewerProps) {
  const zoomLevel = useGameStore(state => state.zoomLevel);
  const revealTier = useGameStore(state => state.revealTier);
  
  // Camera distance based on zoom level (Heardle-style progression)
  const cameraDistance = 5 - zoomLevel * 0.8; // 5 -> 4.2 -> 3.4 -> 2.6
  
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
        <PerspectiveCamera makeDefault position={[0, 0, cameraDistance]} fov={50} />
        
        <StudioLighting />

        {/* Plinth and cyclorama are unlit so the studio stays light at every reveal tier */}
        <mesh position={[0, -1.08, 0]} receiveShadow>
          <cylinderGeometry args={[1.45, 1.62, 0.14, 64]} />
          <meshBasicMaterial color="#E3DED6" toneMapped={false} />
        </mesh>
        
        <SceneObject visualProfile={visualProfile} />
        
        {/* Contact shadows for grounded look */}
        <ContactShadows
          position={[0, -1, 0]}
          opacity={revealTier === 0 ? 0.15 : 0.3}
          scale={10}
          blur={3}
          far={4}
          color="#1A1A1A"
        />
        
        {/* Orbit controls - limited initially */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false} // Rotation controlled by discrete buttons
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
        
        {/* Infinity cyclorama backdrop */}
        <mesh position={[0, 0, -8]}>
          <planeGeometry args={[50, 50]} />
          <meshBasicMaterial color="#F0EEEA" toneMapped={false} />
        </mesh>
      </Canvas>
      
      {/* Overlay progression badge */}
      <div style={{
        position: 'absolute',
        top: 'calc(var(--space-6) + 6px)',
        right: 'calc(var(--space-6) + 6px)',
        background: 'rgba(255, 255, 255, 0.86)',
        backdropFilter: 'blur(10px)',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: '999px',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-ui)',
        fontWeight: 500,
        letterSpacing: '0.02em',
        color: 'var(--ink-secondary)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
      }}>
        Zoom {zoomLevel + 1}/4 · Reveal {revealTier + 1}/4
      </div>
      <StageCaption />
    </div>
  );
}
