import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import AgentAvatar3D from './AgentAvatar3D';
import JudgeAvatar3D from './JudgeAvatar3D';

// Camera controller component to handle smooth cinematic transitions
function CameraController({ activeSpeaker }) {
  const targetPos = useRef(new THREE.Vector3(0, 0.6, 6.2));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    if (activeSpeaker === 'A') {
      // Focus on Agent A (Left)
      targetPos.current.set(-1.6, 0.8, 3.6);
      targetLook.current.set(-2.2, 0.3, 0);
    } else if (activeSpeaker === 'B') {
      // Focus on Agent B (Right)
      targetPos.current.set(1.6, 0.8, 3.6);
      targetLook.current.set(2.2, 0.3, 0);
    } else if (activeSpeaker === 'J') {
      // Focus on the Judge (Center Back, elevated)
      targetPos.current.set(0, 1.4, 3.6);
      targetLook.current.set(0, 0.8, -1.8);
    } else {
      // Wide shot (Idle / Verdict)
      targetPos.current.set(0, 0.6, 6.2);
      targetLook.current.set(0, 0.1, -0.2);
    }

    // Smooth position interpolation
    state.camera.position.lerp(targetPos.current, 0.05);

    // Smooth focal point interpolation
    currentLook.current.lerp(targetLook.current, 0.05);
    state.camera.lookAt(currentLook.current);
  });

  return null;
}

// Glowing cylindrical table component
function DebateTable() {
  return (
    <group position={[0, -0.6, 0]}>
      {/* Table Top Disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.7, 1.7, 0.1, 64]} />
        <meshStandardMaterial 
          color="#131b26" 
          roughness={0.2} 
          metalness={0.85} 
        />
      </mesh>
      
      {/* Table Top Neon Ring */}
      <mesh position={[0, 0.051, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.62, 1.68, 64]} />
        <meshBasicMaterial color="#3b82f6" toneMapped={false} transparent opacity={0.7} />
      </mesh>

      {/* Pedestal Leg */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.22, 0.45, 1.1, 32]} />
        <meshStandardMaterial 
          color="#1e272e" 
          roughness={0.4} 
          metalness={0.9} 
        />
      </mesh>
    </group>
  );
}

export default function DebateScene3D({ state, activeSpeaker, verdict }) {
  const isAActive = activeSpeaker === 'A';
  const isBActive = activeSpeaker === 'B';
  const isJActive = activeSpeaker === 'J';

  const isADimmed = activeSpeaker && activeSpeaker !== 'A';
  const isBDimmed = activeSpeaker && activeSpeaker !== 'B';

  const isAWinner = state === 'verdict' && verdict?.winner === 'A';
  const isBWinner = state === 'verdict' && verdict?.winner === 'B';
  const isJActivePhase = state === 'judging' || state === 'verdict';

  return (
    <div className="absolute inset-0 w-full h-full -z-10 bg-[#06090e]">
      <Canvas
        camera={{ position: [0, 0.5, 6.5], fov: 45 }}
        gl={{ antialias: true }}
      >
        {/* Background color */}
        <color attach="background" args={['#06090e']} />

        {/* Ambient environment stars */}
        <Stars 
          radius={100} 
          depth={50} 
          count={1500} 
          factor={4} 
          saturation={0.6} 
          fade 
          speed={1.5} 
        />

        {/* Lighting system */}
        <ambientLight intensity={0.45} />
        <directionalLight 
          position={[5, 10, 3]} 
          intensity={1.0} 
          castShadow 
        />
        
        {/* Soft cyan & pink side lights for futuristic palette */}
        <pointLight position={[-8, -5, -8]} intensity={0.2} color="#3b82f6" />
        <pointLight position={[8, 8, 8]} intensity={0.2} color="#ec4899" />

        {/* Floor Arena Grid */}
        <gridHelper 
          args={[40, 40, '#1b2330', '#0a0f18']} 
          position={[0, -1.2, 0]} 
        />

        {/* Table in the Center */}
        <DebateTable />

        {/* Floor Highlights underneath positions */}
        <mesh position={[-2.2, -1.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.8, 32]} />
          <meshBasicMaterial color={isAWinner ? "#f1c40f" : "#ff5e57"} opacity={0.12} transparent />
        </mesh>
        
        <mesh position={[2.2, -1.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.8, 32]} />
          <meshBasicMaterial color={isBWinner ? "#f1c40f" : "#00d2d3"} opacity={0.12} transparent />
        </mesh>

        <mesh position={[0, -1.18, -1.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.0, 32]} />
          <meshBasicMaterial color="#f1c40f" opacity={0.1} transparent />
        </mesh>

        {/* Agent A (Left, warm orange/red color theme) */}
        <group position={[-2.2, 0, 0]} rotation={[0, 0.4, 0]}>
          <AgentAvatar3D 
            speakerId="A" 
            isActive={isAActive} 
            isDimmed={isADimmed} 
            isWinner={isAWinner}
          />
        </group>

        {/* Agent B (Right, cool cyan/blue color theme) */}
        <group position={[2.2, 0, 0]} rotation={[0, -0.4, 0]}>
          <AgentAvatar3D 
            speakerId="B" 
            isActive={isBActive} 
            isDimmed={isBDimmed} 
            isWinner={isBWinner}
          />
        </group>

        {/* Judge (Center Back) - Always visible, rises/lights up during judging */}
        <group position={[0, 0.4, -1.8]}>
          <JudgeAvatar3D 
            isVisible={true} 
            isActive={isJActive || isJActivePhase} 
          />
        </group>

        {/* Camera controller handles automatic focal transitions */}
        <CameraController activeSpeaker={activeSpeaker} />

        {/* Orbit Controls (constrained to prevent scene breaking) */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2.1} 
          minPolarAngle={Math.PI / 3.5} 
          minAzimuthAngle={-Math.PI / 5}
          maxAzimuthAngle={Math.PI / 5}
        />
      </Canvas>
    </div>
  );
}

