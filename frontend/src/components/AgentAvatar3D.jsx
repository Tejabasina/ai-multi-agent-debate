import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export default function AgentAvatar3D({ speakerId, isActive, isDimmed, isWinner }) {
  const groupRef = useRef();
  const headRef = useRef();
  const ringsRef = useRef();
  const ledRef = useRef();

  // Target scales and positions for interpolation
  const targetScaleRef = useRef(new THREE.Vector3(1, 1, 1));
  const currentScaleRef = useRef(new THREE.Vector3(1, 1, 1));


  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    // Define target scale depending on state (Winner, Speaking, Dimmed, or Idle)
    let scaleVal = 1.0;
    if (isWinner) {
      scaleVal = 1.35;
    } else if (isActive) {
      scaleVal = 1.15;
    } else if (isDimmed) {
      scaleVal = 0.85;
    }
    targetScaleRef.current.set(scaleVal, scaleVal, scaleVal);

    // Smoothly lerp current scale to target scale
    currentScaleRef.current.lerp(targetScaleRef.current, 0.1);
    groupRef.current.scale.copy(currentScaleRef.current);

    // Default angle: turn slightly forward. Active angle: turn directly to opponent.
    let targetRotY = speakerId === 'A' ? 0.6 : -0.6;
    if (isActive) {
      targetRotY = speakerId === 'A' ? 1.4 : -1.4;
    }

    // Floating breathing or winner animation
    if (isWinner) {
      groupRef.current.position.y = Math.sin(t * 5.0) * 0.12 + 0.2;
      groupRef.current.rotation.y = t * 2.0; // Victory spin
    } else {
      const floatSpeed = isActive ? 3.0 : 1.2;
      const floatAmp = isActive ? 0.12 : 0.05;
      groupRef.current.position.y = Math.sin(t * floatSpeed) * floatAmp;
      
      // Smoothly lerp rotation to face the opponent
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.08);
    }

    // Rotate head slightly for scanning/nodding effect
    if (headRef.current) {
      if (isActive) {
        headRef.current.rotation.y = Math.sin(t * 2.5) * 0.1;
        headRef.current.rotation.x = Math.sin(t * 5.0) * 0.06; // nodding while speaking
      } else {
        headRef.current.rotation.y = Math.sin(t * 0.6) * 0.15; // slow idle scanning
        headRef.current.rotation.x = 0;
      }
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.z = -t * 0.6;
      ringsRef.current.rotation.y = t * 0.3;
    }

    // Nothing style red micro-LED blinking rate
    if (ledRef.current) {
      const pulse = Math.sin(t * 4.0) * 0.5 + 0.5;
      ledRef.current.material.opacity = 0.3 + pulse * 0.7;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Base platform */}
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 0.25, 32]} />
        <meshStandardMaterial 
          color="#0d0d0d" 
          roughness={0.1} 
          metalness={0.98}
        />
      </mesh>

      {/* Glowing platform ring */}
      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.65, 0.75, 32]} />
        <meshBasicMaterial color={mainColor} toneMapped={false} />
      </mesh>

      {/* Torso (Polished liquid metal robot body) */}
      <mesh position={[0, -0.4, 0]}>
        <coneGeometry args={[0.4, 1.2, 4]} />
        <meshStandardMaterial 
          color={isDimmed ? '#111116' : '#1e1e24'} 
          roughness={0.06} 
          metalness={0.96} 
        />
      </mesh>

      {/* Nothing style red LED indicator dot */}
      <mesh ref={ledRef} position={[0, -0.2, 0.24]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={1.0} toneMapped={false} />
      </mesh>

      {/* Segmented Robot Arms resting on table */}
      <group position={[0, -0.4, 0]}>
        {/* Left Arm */}
        <mesh position={[-0.42, 0.12, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#08080c" metalness={0.98} roughness={0.15} />
        </mesh>
        <mesh position={[-0.52, -0.15, 0.15]} rotation={[0.4, 0.2, -0.15]}>
          <cylinderGeometry args={[0.035, 0.035, 0.45, 8]} />
          <meshStandardMaterial color={isDimmed ? '#111116' : '#1e1e24'} metalness={0.96} roughness={0.08} />
        </mesh>

        {/* Right Arm */}
        <mesh position={[0.42, 0.12, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#08080c" metalness={0.98} roughness={0.15} />
        </mesh>
        <mesh position={[0.52, -0.15, 0.15]} rotation={[0.4, -0.2, 0.15]}>
          <cylinderGeometry args={[0.035, 0.035, 0.45, 8]} />
          <meshStandardMaterial color={isDimmed ? '#111116' : '#1e1e24'} metalness={0.96} roughness={0.08} />
        </mesh>
      </group>

      {/* Neck connector */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
        <meshStandardMaterial color="#0a0a0d" metalness={0.99} roughness={0.1} />
      </mesh>

      {/* Main Head - animated glowing sphere with nested robot eyes & antenna */}
      <mesh ref={headRef} position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        {isActive ? (
          <MeshDistortMaterial
            color={mainColor}
            emissive={glowColor}
            emissiveIntensity={1.4}
            distort={0.25}
            speed={3}
            roughness={0.05}
            metalness={0.98}
          />
        ) : (
          <meshStandardMaterial
            color={mainColor}
            emissive={glowColor}
            emissiveIntensity={isDimmed ? 0.08 : 0.35}
            roughness={0.08}
            metalness={0.95}
          />
        )}

        {/* Scanning Robot Eyes */}
        <mesh position={[-0.1, 0.06, 0.26]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={isActive ? '#ffffff' : glowColor} toneMapped={false} />
        </mesh>
        <mesh position={[0.1, 0.06, 0.26]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={isActive ? '#ffffff' : glowColor} toneMapped={false} />
        </mesh>

        {/* Head Antenna */}
        <group position={[0, 0.28, 0]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.16, 8]} />
            <meshStandardMaterial color="#08080c" metalness={0.99} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color={glowColor} toneMapped={false} />
          </mesh>
        </group>
      </mesh>

      {/* Orbiting rings */}
      <group ref={ringsRef} position={[0, 0.6, 0]}>
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[0.52, 0.02, 8, 48]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[0.58, 0.015, 8, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>
      </group>

      {/* Speaker spotlight underneath when active */}
      {isActive && (
        <spotLight
          position={[0, 3, 0]}
          angle={0.5}
          penumbra={1}
          intensity={6}
          color={glowColor}
          target-position={[0, 0, 0]}
        />
      )}
    </group>
  );
}

