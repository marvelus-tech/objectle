import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, Lightformer } from '@react-three/drei';
import { useGameStore } from '../lib/store';
import * as THREE from 'three';

interface ObjectViewerProps {
  objectKey: string;
}

/**
 * The 3D object being displayed
 * Applies silhouette vs color rendering based on revealTier
 */
function SceneObject({ objectKey }: { objectKey: string }) {
  const revealTier = useGameStore(state => state.revealTier);
  const rotationX = useGameStore(state => state.rotationX);
  const rotationY = useGameStore(state => state.rotationY);
  const rotationZ = useGameStore(state => state.rotationZ);
  
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = THREE.MathUtils.degToRad(rotationX);
      meshRef.current.rotation.y = THREE.MathUtils.degToRad(rotationY);
      meshRef.current.rotation.z = THREE.MathUtils.degToRad(rotationZ);
    }
  }, [rotationX, rotationY, rotationZ]);
  
  // For MVP: use procedural geometry based on objectKey
  // In production, this would load actual GLTF models from R2
  const getGeometry = () => {
    const key = objectKey.toLowerCase();
    
    // Furniture
    if (key.includes('chair')) {
      return <boxGeometry args={[1, 1.5, 1]} />;
    } else if (key.includes('table') || key.includes('desk')) {
      return <boxGeometry args={[2, 0.2, 1.5]} />;
    } else if (key.includes('lamp')) {
      return <cylinderGeometry args={[0.3, 0.5, 1.5, 16]} />;
    } else if (key.includes('bench')) {
      return <boxGeometry args={[2.5, 0.3, 0.8]} />;
    }
    
    // Kitchenware
    else if (key.includes('mug') || key.includes('cup')) {
      return <cylinderGeometry args={[0.5, 0.6, 1, 32]} />;
    } else if (key.includes('bowl')) {
      return <sphereGeometry args={[0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />;
    } else if (key.includes('spoon')) {
      return <capsuleGeometry args={[0.15, 1.2, 8, 16]} />;
    }
    
    // Vehicles
    else if (key.includes('bicycle') || key.includes('bike')) {
      return <torusGeometry args={[1, 0.3, 16, 100]} />;
    } else if (key.includes('car')) {
      return <boxGeometry args={[2, 0.8, 1.2]} />;
    }
    
    // Tools
    else if (key.includes('hammer')) {
      return <capsuleGeometry args={[0.2, 1, 8, 16]} />;
    } else if (key.includes('key')) {
      return <boxGeometry args={[0.15, 1, 0.05]} />;
    }
    
    // Electronics
    else if (key.includes('phone')) {
      return <boxGeometry args={[0.4, 0.8, 0.08]} />;
    }
    
    // Default
    return <boxGeometry args={[1, 1, 1]} />;
  };
  
  // Material changes based on reveal tier
  const getMaterial = () => {
    if (revealTier === 0) {
      // Silhouette: pure black
      return <meshBasicMaterial color="#000000" />;
    } else if (revealTier === 1) {
      // Partial reveal: dark gray clay
      return <meshStandardMaterial color="#505050" roughness={0.8} metalness={0.1} />;
    } else if (revealTier === 2) {
      // Full color: light clay/ceramic
      return <meshStandardMaterial color="#d4c4b0" roughness={0.6} metalness={0.05} />;
    } else {
      // Full studio: detailed material with ambient occlusion effect
      return <meshStandardMaterial color="#e8dcc8" roughness={0.5} metalness={0.1} />;
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
 * Light studio with cool off-white theme
 * Uses Lightformers for soft studio lighting
 */
function StudioLighting() {
  const revealTier = useGameStore(state => state.revealTier);
  
  return (
    <>
      {/* Ambient light - always present */}
      <ambientLight intensity={revealTier === 0 ? 0.3 : 0.5} />
      
      {/* Key light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={revealTier === 0 ? 0.2 : 0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* Fill lights - more prominent as reveal tier increases */}
      {revealTier >= 1 && (
        <>
          <directionalLight position={[-3, 2, -5]} intensity={0.3} />
          <directionalLight position={[0, -2, 2]} intensity={0.2} />
        </>
      )}
      
      {/* Environment and Lightformers for studio look (tier 2+) */}
      {revealTier >= 2 && (
        <Environment preset="studio" background={false}>
          <Lightformer
            intensity={0.5}
            position={[10, 10, 10]}
            scale={[10, 10, 10]}
            form="ring"
            color="#f0f4f8"
          />
          <Lightformer
            intensity={0.3}
            position={[-10, 5, -10]}
            scale={[8, 8, 8]}
            form="rect"
            color="#e8f0f8"
          />
        </Environment>
      )}
    </>
  );
}

export default function ObjectViewer({ objectKey }: ObjectViewerProps) {
  const zoomLevel = useGameStore(state => state.zoomLevel);
  const revealTier = useGameStore(state => state.revealTier);
  
  // Camera distance based on zoom level (Heardle-style progression)
  const cameraDistance = 5 - zoomLevel * 0.8; // 5 -> 4.2 -> 3.4 -> 2.6
  
  return (
    <div style={{ width: '100%', height: '100%', background: '#f0f4f8', position: 'relative' }}>
      <Canvas
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: '#f0f4f8' }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, cameraDistance]} fov={50} />
        
        <StudioLighting />
        
        <SceneObject objectKey={objectKey} />
        
        {/* Contact shadows for grounded look */}
        <ContactShadows
          position={[0, -1, 0]}
          opacity={revealTier === 0 ? 0.2 : 0.5}
          scale={10}
          blur={2}
          far={4}
        />
        
        {/* Orbit controls - limited initially */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false} // Rotation controlled by discrete buttons
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
        
        {/* Infinity cyclorama effect */}
        <mesh position={[0, 0, -8]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#f0f4f8" roughness={1} />
        </mesh>
      </Canvas>
      
      {/* Overlay info */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666',
      }}>
        Zoom: {zoomLevel + 1}/4 | Reveal: {revealTier + 1}/4
      </div>
    </div>
  );
}
