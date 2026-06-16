import React from 'react';
import { motion } from 'motion/react';

interface AnimatedCatProps {
  size?: number;
  className?: string;
  color?: string;
}

export default function AnimatedCat({ size = 40, className = "", color = "#ffffff" }: AnimatedCatProps) {
  return (
    <motion.div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          scaleY: [1, 1.05, 1],
          scaleX: [1, 0.98, 1],
          y: [0, -2, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Tail - Bouncy and swaying */}
        <motion.path
          d="M140 160 C180 160 190 100 160 80"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          animate={{ 
            rotate: [-15, 15, -15],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2, 
            ease: "easeInOut" 
          }}
          style={{ originX: "140px", originY: "160px" }}
        />

        {/* Body - Rounder and squishier */}
        <motion.ellipse
          cx="100"
          cy="120"
          rx="75"
          ry="65"
          fill="#000000"
          stroke={color}
          strokeWidth="6"
        />

        {/* Ears - Twitching */}
        <motion.path
          d="M50 75 L30 30 L80 60"
          fill="#000000"
          stroke={color}
          strokeWidth="6"
          strokeLinejoin="round"
          animate={{ rotate: [-5, 10, -5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          style={{ originX: "65px", originY: "70px" }}
        />
        <motion.path
          d="M150 75 L170 30 L120 60"
          fill="#000000"
          stroke={color}
          strokeWidth="6"
          strokeLinejoin="round"
          animate={{ rotate: [5, -10, 5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 }}
          style={{ originX: "135px", originY: "70px" }}
        />

        {/* Face Group - Moves slightly for depth */}
        <motion.g
          animate={{ y: [0, 2, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          {/* Eyes - Blinking and expressive */}
          <motion.g>
            {/* Left Eye */}
            <circle cx="70" cy="110" r="15" fill="white" />
            <motion.circle cx="70" cy="110" r="8" fill="black" 
              animate={{ x: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
            <motion.rect
              x="50" y="90" width="40" height="40"
              fill="#000000"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: [0, 0, 1, 0, 0] }}
              transition={{ repeat: Infinity, duration: 4, times: [0, 0.8, 0.85, 0.9, 1] }}
              style={{ originY: "110px" }}
            />

            {/* Right Eye */}
            <circle cx="130" cy="110" r="15" fill="white" />
            <motion.circle cx="130" cy="110" r="8" fill="black"
              animate={{ x: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
            <motion.rect
              x="110" y="90" width="40" height="40"
              fill="#000000"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: [0, 0, 1, 0, 0] }}
              transition={{ repeat: Infinity, duration: 4, times: [0, 0.8, 0.85, 0.9, 1] }}
              style={{ originY: "110px" }}
            />
          </motion.g>

          {/* Nose & Mouth */}
          <motion.path
            d="M95 130 Q100 135 105 130"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <motion.path
            d="M90 140 Q100 150 110 140"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ scaleY: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </motion.g>

        {/* Whiskers */}
        <motion.g stroke={color} strokeWidth="3" strokeLinecap="round">
          <motion.line x1="50" y1="125" x2="20" y2="120" animate={{ rotate: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 2 }} />
          <motion.line x1="50" y1="135" x2="20" y2="140" animate={{ rotate: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 2 }} />
          <motion.line x1="150" y1="125" x2="180" y2="120" animate={{ rotate: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 2 }} />
          <motion.line x1="150" y1="135" x2="180" y2="140" animate={{ rotate: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 2 }} />
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}
