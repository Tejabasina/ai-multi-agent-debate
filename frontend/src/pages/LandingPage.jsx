import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDebate } from '../context/DebateContext';
import { useTranslation } from 'react-i18next';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { 
  LogIn, UserPlus, Mail, Lock, AlertCircle, Sparkles, 
  Database, GitBranch, Terminal, ShieldAlert, Layers
} from 'lucide-react';
import Magnetic from '../components/Magnetic';
import AgentAvatar3D from '../components/AgentAvatar3D';
import ErrorBoundary from '../components/ErrorBoundary';


// ==========================================
// R3F 3D SUB-COMPONENTS FOR LANDING CANVAS
// ==========================================

function DataStreams({ activeSpeaker }) {
  const groupRef = useRef();
  const particleRef = useRef();
  
  // Create a clean bezier curve between Robot A and Robot B
  const curve = useRef(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.2, 0.5, 0),
      new THREE.Vector3(-1.0, 1.2, 0.5),
      new THREE.Vector3(1.0, 1.2, -0.5),
      new THREE.Vector3(2.2, 0.5, 0)
    ])
  );

  useFrame((state) => {
    if (!particleRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Animate glowing data flows along the curve
    let t = (time * 0.45) % 1.0;
    if (activeSpeaker === 'B') {
      t = 1.0 - t; // reverse flow direction
    }
    
    const pos = curve.current.getPointAt(t);
    particleRef.current.position.copy(pos);
  });

  return (
    <group ref={groupRef}>
      {/* Path line spline */}
      <mesh>
        <tubeGeometry args={[curve.current, 64, 0.02, 8, false]} />
        <meshBasicMaterial 
          color={activeSpeaker === 'A' ? '#ff5e57' : '#00d2d3'} 
          transparent 
          opacity={0.15} 
        />
      </mesh>
      {/* Glowing data flow node */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial 
          color={activeSpeaker === 'A' ? '#ff6b6b' : '#4decff'} 
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function LandingChamber({ focusedField, scrollPercent, activeSpeaker }) {
  // Move camera fluidly based on the page scroll position
  useFrame((state) => {
    const t = scrollPercent.current;
    
    // Transition from side perspective (t=0) to higher tactical perspective (t=1)
    const targetCamX = -3 + t * 4;
    const targetCamY = 1.5 + t * 4;
    const targetCamZ = 5 + t * -2;

    state.camera.position.x += (targetCamX - state.camera.position.x) * 0.1;
    state.camera.position.y += (targetCamY - state.camera.position.y) * 0.1;
    state.camera.position.z += (targetCamZ - state.camera.position.z) * 0.1;
    state.camera.lookAt(0, 0.5, 0);
  });

  // Color values based on which input field is focused
  let spotColor = '#ffffff';
  let spotIntensity = 1.5;
  let targetX = 0;

  if (focusedField === 'email') {
    spotColor = '#818cf8'; // Electric indigo on focus email
    spotIntensity = 3.5;
    targetX = -2;
  } else if (focusedField === 'password') {
    spotColor = '#00d2d3'; // Neon cyan on focus password
    spotIntensity = 3.5;
    targetX = 2;
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[0, 10, 0]} intensity={0.6} />

      {/* Focus Reactive Spot Light */}
      <spotLight
        position={[targetX, 4, 2]}
        angle={0.6}
        penumbra={0.5}
        intensity={spotIntensity}
        color={spotColor}
        castShadow
      />

      {/* Static mesh table */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 0.2, 32]} />
        <meshStandardMaterial color="#111" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Robot A (Optimist) */}
      <group position={[-2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <AgentAvatar3D speakerId="A" isActive={activeSpeaker === 'A'} />
      </group>

      {/* Robot B (Risk Analyst) */}
      <group position={[2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <AgentAvatar3D speakerId="B" isActive={activeSpeaker === 'B'} />
      </group>


      {/* Dynamic Data Splines */}
      <DataStreams activeSpeaker={activeSpeaker} />

      {/* Floor Grid */}
      <gridHelper args={[20, 20, '#333', '#151515']} position={[0, -0.3, 0]} />
    </>
  );
}

// ==========================================
// LANDING PAGE ELEMENT DEFINITION
// ==========================================

export default function LandingPage({ mode = 'login' }) {
  const { login, token } = useDebate();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Focus-Reactive micro-interaction states
  const [focusedField, setFocusedField] = useState(null);
  const [activeSpeaker, setActiveSpeaker] = useState('A');

  const scrollPercent = useRef(0);

  // Trigger automated speaker swapping to simulate debate on landing page
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSpeaker((prev) => (prev === 'A' ? 'B' : 'A'));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Sync scroll percentage
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollPercent.current = docHeight > 0 ? window.scrollY / docHeight : 0;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (token) navigate('/');
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (mode === 'signup' && !confirmPassword)) {
      setError('Please fill in all fields.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const host = window.location.hostname;
      const port = host === 'localhost' || host === '127.0.0.1' ? ':5000' : '';
      const protocol = window.location.protocol;
      const endpoint = mode === 'login' ? 'login' : 'signup';
      const apiUrl = `${protocol}//${host}${port}/api/auth/${endpoint}`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to authenticate.');

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      console.error('[Landing Auth Error]', err);
      setError(err.message || 'Server connection timed out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* Cinematic Noise Layer overlay */}
      <div className="noise-overlay" />

      {/* Grid container: 70% left, 30% right (responsive) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 h-screen w-full relative">
        
        {/* LEFT SIDE (70% - 3D SciFi Debate Chamber) */}
        <div className="lg:col-span-7 h-[50vh] lg:h-full relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#12101e] border-r border-white/5">
          <ErrorBoundary>
            <Canvas shadows camera={{ position: [-3, 1.5, 5], fov: 40 }}>
              <color attach="background" args={['#0A0A0A']} />
              <fog attach="fog" args={['#0A0A0A', 5, 15]} />
              
              <LandingChamber 
                focusedField={focusedField} 
                scrollPercent={scrollPercent} 
                activeSpeaker={activeSpeaker} 
              />
              
              <OrbitControls 
                enableZoom={false} 
                maxPolarAngle={Math.PI / 2.2} 
                minPolarAngle={Math.PI / 4} 
              />
            </Canvas>
          </ErrorBoundary>

          
          {/* Subtle floating overlay inside Canvas viewport */}
          <div className="absolute bottom-6 left-6 z-10 hidden md:block">
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
              CHAMBER STATUS: DEBATING / MOCK_SIMULATION_ACTIVE
            </span>
          </div>
        </div>

        {/* RIGHT SIDE (30% - Sticky Glass Gateway Panel) */}
        <div className="lg:col-span-3 h-[50vh] lg:h-full overflow-y-auto flex flex-col justify-center px-8 py-12 bg-black/45 backdrop-blur-md relative border-l border-white/5 z-20">
          
          <div className="w-full max-w-sm mx-auto my-auto space-y-6 pt-12">
            <div className="text-center lg:text-left">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black tracking-tight font-display bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent uppercase">
                {mode === 'login' ? t('login') : t('signup')}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Establish neural connection link
              </p>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="flex items-start gap-2 bg-red-950/30 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-0.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-600">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="quantum@domain.com"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 focus:border-indigo-500/70 rounded-xl text-xs font-semibold placeholder-slate-600 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all duration-300 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-0.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-600">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 focus:border-indigo-500/70 rounded-xl text-xs font-semibold placeholder-slate-600 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all duration-300 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Confirm Password (Signup only) */}
              {mode === 'signup' && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-0.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-600">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 focus:border-indigo-500/70 rounded-xl text-xs font-semibold placeholder-slate-600 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all duration-300 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Magnetic Gateway Button */}
              <Magnetic>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-w-[260px] flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-300 shadow-xl shadow-indigo-900/10 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-xs tracking-widest uppercase"
                >
                  {loading ? 'Transmitting credentials...' : mode === 'login' ? t('login') : t('signup')}
                </button>
              </Magnetic>
            </form>

            <div className="border-t border-slate-850 pt-5 text-center">
              <p className="text-xs text-slate-400 font-medium">
                {mode === 'login' ? (
                  <>
                    Don't have a login?{' '}
                    <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                      Register account
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                      Log in here
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* SECOND FOLD: The Bento Grid Footer on Scroll */}
      <section className="w-full max-w-5xl mx-auto px-6 py-20 relative z-30">
        <div className="text-center md:text-left mb-12">
          <h2 className="text-xl font-bold font-display uppercase tracking-widest text-slate-400">
            Chamber Architecture
          </h2>
          <p className="text-xs text-slate-500 font-mono tracking-widest mt-1">
            TECHNICAL STRUCTURE & BENTO TELEMETRY METRICS
          </p>
        </div>

        {/* Custom CSS Grid Bento Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[160px] gap-4">
          
          {/* Card 1: Stack layout details */}
          <div className="md:col-span-4 md:row-span-2 glass-panel rounded-2xl p-8 border border-white/5 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full"></div>
            <div>
              <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase font-bold">
                SYSTEM STACK
              </span>
              <h3 className="text-xl font-black uppercase font-display text-white tracking-wider mt-2.5">
                React, Next-gen R3F Canvas & Node Express
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-2 max-w-md">
                A combination of React Three Fiber WebGL rendering, Express upgrade streams, and SQLite localized caching layers to produce real-time multi-agent logic battles.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 mt-4">
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-slate-400">Three.js</span>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-slate-400">Framer Motion</span>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-slate-400">Lenis Scroll</span>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-slate-400">GSAP</span>
            </div>
          </div>

          {/* Card 2: Git status */}
          <div className="md:col-span-2 md:row-span-1 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between group">
            <div className="flex items-center justify-between text-slate-400">
              <GitBranch className="w-5 h-5 text-indigo-400" />
              <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30">
                Pushed
              </span>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">
                GitHub Repository Status
              </p>
              <h4 className="text-sm font-bold text-white tracking-wide mt-1 truncate">
                Tejabasina/ai-multi-agent-debate
              </h4>
            </div>
          </div>

          {/* Card 3: Database architecture */}
          <div className="md:col-span-2 md:row-span-1 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between group">
            <div className="flex items-center justify-between text-slate-400">
              <Database className="w-5 h-5 text-purple-400" />
              <span className="text-[9px] font-mono text-indigo-400">SQLite3</span>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">
                Persistent Data Layers
              </p>
              <h4 className="text-sm font-bold text-white tracking-wide mt-1">
                Scoped schemas & caching tables
              </h4>
            </div>
          </div>

          {/* Card 4: Terminal Bootlogs */}
          <div className="md:col-span-3 md:row-span-1 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Terminal className="w-4 h-4" />
              <span className="text-[9px] font-mono tracking-widest uppercase font-bold">
                Telemetry Log
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono leading-tight flex-1">
              [SYSTEM] JWT keys mounted. SQLite connections WAL. Claude evaluator ready.
            </p>
          </div>

          {/* Card 5: Core agents metric */}
          <div className="md:col-span-3 md:row-span-1 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between group">
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <Layers className="w-4 h-4" />
              <span className="text-[9px] font-mono tracking-widest uppercase font-bold">
                Agent Personas
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono leading-tight flex-1">
              Agent A [Constructive Optimist] vs Agent B [Cautious Risk Analyst]. Impartial Judge [Claude AI].
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
