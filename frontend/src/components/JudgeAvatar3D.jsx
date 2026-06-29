import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function JudgeAvatar3D({ isVisible, isActive }) {
  const groupRef = useRef();
  const headRef = useRef();
  const haloRef = useRef();

  const targetY = useRef(0.0);
  const currentY = useRef(0.0);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    // Transition vertical position to sit up when judging starts
    targetY.current = isActive ? 0.6 : 0.0;

    // Smoothly lerp vertical height
    currentY.current = THREE.MathUtils.lerp(currentY.current, targetY.current, 0.06);
    groupRef.current.position.y = currentY.current;

    // Slow down spin and float when dormant (not active)
    const spinSpeed = isActive ? 1.0 : 0.15;

    // Spin the judge's futuristic diamond head
    if (headRef.current) {
      headRef.current.rotation.y = t * spinSpeed * 0.8;
      headRef.current.rotation.x = t * spinSpeed * 0.3;
    }

    // Bob the halo up and down
    if (haloRef.current) {
      haloRef.current.rotation.z = t * spinSpeed * 0.2;
      haloRef.current.position.y = 1.3 + Math.sin(t * (isActive ? 2 : 0.5)) * (isActive ? 0.04 : 0.01);
    }
  });

  const goldColor = '#f39c12';
  const glowColor = '#f1c40f';
  // Use a dim dark gold color when not active
  const activeGlowColor = isActive ? glowColor : '#523a05';

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Heavy Base Stand */}
      <mesh position={[0, -1.0, 0]}>
        <cylinderGeometry args={[0.9, 1.1, 0.4, 8]} />
        <meshStandardMaterial 
          color="#050508" 
          roughness={0.05} 
          metalness={0.99} 
        />
      </mesh>

      {/* Glowing Golden Ring base */}
      <mesh position={[0, -0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 0.95, 8]} />
        <meshBasicMaterial color={activeGlowColor} toneMapped={false} />
      </mesh>

      {/* Main Body Column (Monolithic structure) */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.5, 1.4, 0.5]} />
        <meshStandardMaterial 
          color="#0a0a0d" 
          roughness={0.05} 
          metalness={0.99}
        />
      </mesh>

      {/* Golden Shoulders */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.2, 0.15, 0.4]} />
        <meshStandardMaterial 
          color={isActive ? goldColor : '#523a05'} 
          roughness={0.05} 
          metalness={0.98}
        />
      </mesh>

      {/* Glowing Judge Head (Octahedron) */}
      <mesh ref={headRef} position={[0, 1.1, 0]}>
        <octahedronGeometry args={[0.35]} />
        <meshStandardMaterial
          color={isActive ? goldColor : '#523a05'}
          emissive={glowColor}
          emissiveIntensity={isActive ? 1.8 : 0.04}
          roughness={0.02}
          metalness={0.99}
        />
      </mesh>

      {/* Glowing Golden Halo overhead */}
      <mesh ref={haloRef} position={[0, 1.6, 0]} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[0.5, 0.025, 8, 32]} />
        <meshBasicMaterial color={activeGlowColor} toneMapped={false} />
      </mesh>

      {/* Judging Spotlight when evaluating */}
      {isActive && (
        <spotLight
          position={[0, 4, 0]}
          angle={0.8}
          penumbra={1}
          intensity={8}
          color={glowColor}
          target-position={[0, 0, 0]}
        />
      )}
    </group>
  );
}

