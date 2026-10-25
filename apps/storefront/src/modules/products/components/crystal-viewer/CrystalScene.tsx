"use client"

import { useEffect, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  MeshTransmissionMaterial,
  OrbitControls,
  Sparkles,
} from "@react-three/drei"
import * as THREE from "three"
import { CLUSTER_TINTS, type StoneProfile } from "./stone-profile"

/**
 * The 3D stone study: a procedural crystal rendered with a transmission
 * (glass-like) material, lit by a locally-rendered environment — no remote
 * HDR fetches, so the viewer works fully offline once the JS chunk loads.
 */

function StoneMaterial({ profile }: { profile: StoneProfile }) {
  return (
    <MeshTransmissionMaterial
      color={profile.color}
      roughness={profile.roughness}
      transmission={profile.transmission}
      thickness={profile.thickness}
      ior={profile.ior}
      chromaticAberration={0.06}
      anisotropicBlur={0.4}
      distortion={0.15}
      distortionScale={0.4}
      temporalDistortion={0.1}
      flatShading
    />
  )
}

/** Dispose GPU-side geometry when the viewer unmounts (e.g. PDP change). */
function useDisposeOnUnmount(geo: THREE.BufferGeometry) {
  useEffect(() => {
    return () => {
      geo.dispose()
    }
  }, [geo])
}

/** Classic quartz point: hexagonal prism body + hexagonal pyramid tip. */
function PointCrystal({
  profile,
  scale = 1,
  tint,
}: {
  profile: StoneProfile
  scale?: number
  tint?: string
}) {
  const body = useMemo(
    () => new THREE.CylinderGeometry(0.55, 0.68, 1.9, 6, 1),
    []
  )
  const tip = useMemo(() => new THREE.ConeGeometry(0.55, 0.95, 6), [])
  useDisposeOnUnmount(body)
  useDisposeOnUnmount(tip)
  const tinted: StoneProfile = tint ? { ...profile, color: tint } : profile

  return (
    <group scale={scale} rotation={[0, Math.PI / 6, 0]}>
      <mesh geometry={body} position={[0, 0.05, 0]}>
        <StoneMaterial profile={tinted} />
      </mesh>
      <mesh geometry={tip} position={[0, 1.475, 0]}>
        <StoneMaterial profile={tinted} />
      </mesh>
    </group>
  )
}

/** Polished tumble: a softened icosahedron, flat-shaded for facet glints. */
function TumbledCrystal({ profile }: { profile: StoneProfile }) {
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.98, 1), [])
  useDisposeOnUnmount(geo)
  return (
    <mesh geometry={geo} scale={[1, 0.78, 1]} rotation={[0.4, 0.6, 0.15]}>
      <StoneMaterial profile={profile} />
    </mesh>
  )
}

/** Cluster: a fan of small points in varied tints (e.g. chakra sets). */
function ClusterCrystal({ profile }: { profile: StoneProfile }) {
  const minis = useMemo(
    () =>
      CLUSTER_TINTS.map((tint, i) => {
        const angle = (i / CLUSTER_TINTS.length) * Math.PI * 2
        const radius = 0.55 + (i % 2) * 0.28
        return {
          tint,
          position: [
            Math.cos(angle) * radius,
            -0.55 + (i % 3) * 0.18,
            Math.sin(angle) * radius,
          ] as [number, number, number],
          tilt: 0.28 + (i % 3) * 0.14,
          scale: 0.3 + (i % 2) * 0.1,
          spin: angle,
        }
      }),
    []
  )
  return (
    <group>
      {minis.map((m, i) => (
        <group
          key={i}
          position={m.position}
          rotation={[m.tilt, m.spin, 0]}
        >
          <PointCrystal profile={profile} scale={m.scale} tint={m.tint} />
        </group>
      ))}
    </group>
  )
}

function CrystalMesh({ profile }: { profile: StoneProfile }) {
  if (profile.habit === "tumbled") return <TumbledCrystal profile={profile} />
  if (profile.habit === "cluster") return <ClusterCrystal profile={profile} />
  return <PointCrystal profile={profile} />
}

export default function CrystalScene({ profile }: { profile: StoneProfile }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.5, 4.6], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 4]} intensity={1.1} color="#fff4e0" />
      <directionalLight position={[-5, 3, -2]} intensity={0.35} color={profile.glow} />
      <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.85}>
        <CrystalMesh profile={profile} />
      </Float>
      <Sparkles
        count={36}
        scale={[3.4, 2.6, 3.4]}
        position={[0, 0.2, 0]}
        size={2.2}
        speed={0.25}
        opacity={0.5}
        color="#fff3d6"
      />
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.38}
        scale={7}
        blur={2.6}
        far={3.2}
        resolution={512}
        color="#4a3f30"
      />
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <Lightformer
            form="rect"
            intensity={5}
            position={[0, 5, -9]}
            scale={[10, 10]}
            color="#fff8ea"
          />
          <Lightformer
            form="circle"
            intensity={2.5}
            position={[-5, 2, -1]}
            scale={4}
            color="#d9e9f2"
          />
          <Lightformer
            form="circle"
            intensity={2}
            position={[5, -1, -1]}
            scale={3.5}
            color="#f2ddc8"
          />
          <Lightformer
            form="rect"
            intensity={1.2}
            position={[0, -4, 2]}
            scale={[8, 3]}
            color="#e8ddc8"
          />
        </group>
      </Environment>
      <OrbitControls
        makeDefault
        target={[0, 0.45, 0]}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.9}
        enableDamping
        dampingFactor={0.08}
        minDistance={2.8}
        maxDistance={7.5}
        minPolarAngle={0.85}
        maxPolarAngle={1.8}
      />
    </Canvas>
  )
}
