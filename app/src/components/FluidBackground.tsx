import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function FluidGrid() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  const count = 30 // Reduced from 60 for performance
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMemo(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.elapsedTime
    mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05
    mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05

    let idx = 0
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const x = (i - count / 2) * 0.3
        const z = (j - count / 2) * 0.3

        const dx = x - mouseRef.current.x * 5
        const dz = z + mouseRef.current.y * 5
        const dist = Math.sqrt(dx * dx + dz * dz)

        const wave = Math.sin(x * 0.5 + time * 0.3) * Math.cos(z * 0.5 + time * 0.2) * 0.3
        const bulge = Math.max(0, 1.5 - dist * 0.4) * 0.8
        const y = wave + bulge * Math.exp(-dist * 0.3)

        dummy.position.set(x, y, z)
        dummy.scale.setScalar(0.12 + bulge * 0.04)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(idx++, dummy.matrix)
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count * count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#1a1a2e"
        transparent
        opacity={0.12}
        roughness={0.3}
        metalness={0.6}
      />
    </instancedMesh>
  )
}

function PrismaticOrbs() {
  const groupRef = useRef<THREE.Group>(null)

  const orbs = useMemo(() => {
    return [
      { color: '#6366f1', pos: [-4, 1, -3], scale: 2.5, speed: 0.2 },
      { color: '#ec4899', pos: [3, -1, -4], scale: 2.0, speed: 0.3 },
      { color: '#06b6d4', pos: [0, 2, -5], scale: 3.0, speed: 0.15 },
    ]
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime

    groupRef.current.children.forEach((child, i) => {
      const orb = orbs[i]
      child.position.x = orb.pos[0] + Math.sin(time * orb.speed + i) * 1.5
      child.position.y = orb.pos[1] + Math.cos(time * orb.speed * 0.7 + i) * 0.8
      child.position.z = orb.pos[2]
      const pulse = 1 + Math.sin(time * 0.5 + i * 2) * 0.15
      child.scale.setScalar(orb.scale * pulse)
    })
  })

  return (
    <group ref={groupRef}>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.pos as [number, number, number]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={orb.color}
            transparent
            opacity={0.1}
          />
        </mesh>
      ))}
    </group>
  )
}

function AtmosphereVignette() {
  return (
    <mesh position={[0, 0, -8]}>
      <planeGeometry args={[30, 30]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={{
          uColor: { value: new THREE.Color('#050505') },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          varying vec2 vUv;
          void main() {
            float dist = distance(vUv, vec2(0.5));
            float alpha = smoothstep(0.2, 0.8, dist) * 0.85;
            gl_FragColor = vec4(uColor, alpha);
          }
        `}
      />
    </mesh>
  )
}

export default function FluidBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 5, 8], fov: 60 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} />
        <FluidGrid />
        <PrismaticOrbs />
        <AtmosphereVignette />
      </Canvas>
    </div>
  )
}
