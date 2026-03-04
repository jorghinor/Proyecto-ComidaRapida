'use client'
import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'

export default function Food3D(){
  return (
    <div className="h-64 w-full">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10,10,10]} />
        <mesh rotation={[0.4, 0.2, 0]}>
          <boxGeometry args={[2,2,0.2]} />
          <meshStandardMaterial color={'orange'} />
        </mesh>
        <OrbitControls />
        <Stars />
      </Canvas>
    </div>
  )
}
