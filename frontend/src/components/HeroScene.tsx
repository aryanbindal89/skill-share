import { Suspense, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line, OrbitControls, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

const nodes = [
  { label: 'Design', hue: '#d68068', position: [-1.65, 1.05, -0.2] as [number, number, number], category: 'design' },
  { label: 'Code', hue: '#94b1a3', position: [1.62, 1.02, -0.35] as [number, number, number], category: 'programming' },
  { label: 'Ideas', hue: '#d4ad6d', position: [-1.95, -0.82, -0.28] as [number, number, number], category: 'problem-solving' },
  { label: 'Data', hue: '#a89bd6', position: [1.85, -0.78, -0.4] as [number, number, number], category: 'data-science' },
]

function Core() {
  const ref = useRef<THREE.Group>(null)
  useFrame((state, delta) => { if (!ref.current) return; ref.current.rotation.y += delta * 0.14; const tilt = Math.sin(state.clock.elapsedTime * 0.18) * 0.07 + state.pointer.y * 0.055; ref.current.rotation.x += (tilt - ref.current.rotation.x) * delta * 2 })
  return <group ref={ref}>
    <mesh><icosahedronGeometry args={[0.77, 1]} /><meshStandardMaterial color="#b6b7ad" metalness={0.87} roughness={0.24} flatShading /></mesh>
    <mesh rotation={[0.45, 0.25, 0.7]}><torusGeometry args={[1.04, 0.012, 8, 120]} /><meshStandardMaterial color="#dc7963" metalness={0.75} emissive="#8c3d2f" emissiveIntensity={0.18} /></mesh>
    <mesh rotation={[-0.62, 0.1, -0.35]}><torusGeometry args={[1.19, 0.008, 8, 120]} /><meshStandardMaterial color="#bbc5bd" metalness={0.8} roughness={0.25} /></mesh>
  </group>
}

function SceneParallax({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.position.x += (state.pointer.x * 0.13 - ref.current.position.x) * delta * 1.8
    ref.current.position.y += (state.pointer.y * 0.1 - ref.current.position.y) * delta * 1.8
  })
  return <group ref={ref}>{children}</group>
}

function SkillNodes({ onSelect, onHover }: { onSelect: (category: string) => void; onHover: (name: string | null) => void }) {
  return <>
    {nodes.map((node, index) => <group key={node.label} position={node.position}>
      <Line points={[[0, 0, 0], [-node.position[0] * 0.65, -node.position[1] * 0.65, 0.1]]} color={node.hue} lineWidth={0.8} transparent opacity={0.35} />
      <Float speed={1 + index * 0.13} rotationIntensity={0.2} floatIntensity={0.22}>
        <mesh onPointerOver={(event) => { event.stopPropagation(); onHover(node.label) }} onPointerOut={() => onHover(null)} onClick={(event) => { event.stopPropagation(); onSelect(node.category) }}>
          <octahedronGeometry args={[0.2 + index % 2 * 0.04, 0]} /><meshStandardMaterial color={node.hue} metalness={0.72} roughness={0.25} emissive={node.hue} emissiveIntensity={0.23} />
        </mesh>
      </Float>
    </group>)}
    <Float speed={0.7} floatIntensity={0.18}><mesh position={[0, 1.76, -0.75]} rotation={[0.2, 0.4, 0.2]}><boxGeometry args={[0.18, 0.18, 0.18]} /><meshStandardMaterial color="#d5cbb2" metalness={0.82} roughness={0.28} /></mesh></Float>
  </>
}

export default function HeroScene({ onSelect }: { onSelect: (category: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)
  return <div className="hero-scene-wrap" aria-label="Interactive 3D map of connected learning skills">
    <Canvas dpr={[1, 1.45]} camera={{ position: [0, 0, 6.1], fov: 42 }} gl={{ alpha: true, antialias: true }} fallback={<div className="hero-scene-fallback"><span className="fallback-core">s.</span><span>Explore the learning map</span><button onClick={() => onSelect('design')}>Design</button><button onClick={() => onSelect('programming')}>Code</button><button onClick={() => onSelect('problem-solving')}>Ideas</button><button onClick={() => onSelect('data-science')}>Data</button></div>}>
      <ambientLight intensity={1.05} /><directionalLight position={[3, 4, 5]} intensity={2.3} color="#fff6e9" /><pointLight position={[-3, -1, 2]} intensity={28} color="#c55d48" /><pointLight position={[2, 2, -2]} intensity={13} color="#b2c5b8" />
      <SceneParallax><Suspense fallback={null}><Sparkles count={40} scale={5.2} size={1.5} speed={0.14} opacity={0.42} /><Core /><SkillNodes onSelect={onSelect} onHover={setHovered} /></Suspense></SceneParallax>
      <OrbitControls enablePan={false} enableZoom={false} enableRotate rotateSpeed={0.32} minPolarAngle={Math.PI / 2.3} maxPolarAngle={Math.PI / 1.7} />
    </Canvas>
    <div className={`scene-caption ${hovered ? 'visible' : ''}`} aria-live="polite">{hovered ? <><span className="caption-pulse" />{hovered} · click to explore</> : <><span className="caption-pulse" />A little knowledge goes a long way</>}</div>
  </div>
}
