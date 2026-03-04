import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'

export default function HeroParallax(){
  const ref = useRef<HTMLDivElement|null>(null)
  useEffect(() => {
    if(ref.current){
      gsap.to(ref.current, { scale: 1.03, duration: 20, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    }
  },[])
  return (
    <header className="h-64 relative overflow-hidden">
      <div ref={ref} className="absolute inset-0 bg-[url('/demo/hero-bg.jpg')] bg-cover bg-center" style={{filter:'brightness(0.7)'}} />
      <div className="relative z-10 h-full flex items-center justify-center">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y:0, opacity:1 }} transition={{ duration: 0.8 }}>
          <div className="text-center text-white">
            <h1 className="text-4xl font-extrabold">Comida rápida en oferta</h1>
            <p className="mt-2">Las mejores promociones cercanas a ti</p>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
