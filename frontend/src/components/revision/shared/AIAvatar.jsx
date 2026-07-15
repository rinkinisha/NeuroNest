import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';

const AIAvatar = ({ className = "w-full h-full", reaction = "idle", speechBubble = "" }) => {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Sparkles generator based on reaction
  const getSparklesCount = () => {
    if (reaction === 'correct') return 14;
    if (reaction === 'incorrect') return 6;
    return 8;
  };

  const sparklesArr = Array.from({ length: getSparklesCount() });

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative flex flex-col items-center justify-center select-none overflow-visible ${className}`}
    >
      {/* Speech Bubble */}
      <AnimatePresence>
        {speechBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            className="absolute -top-16 bg-dark-800/95 backdrop-blur-md border border-primary-500/35 px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-glow-md max-w-xs z-20 text-center"
          >
            <p className="text-xs text-primary-200 font-semibold leading-relaxed">
              {speechBubble}
            </p>
            <div className="absolute left-4 bottom-[-6px] w-3 h-3 bg-dark-800 border-r border-b border-primary-500/35 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Avatar Container */}
      <motion.div
        animate={{
          y: reaction === 'correct' ? [0, -18, 0] : [0, -6, 0],
          rotateY: mousePos.x * 12,
          rotateX: -mousePos.y * 12,
        }}
        transition={{
          y: {
            repeat: Infinity,
            duration: reaction === 'correct' ? 0.6 : 3,
            ease: "easeInOut"
          },
          rotateY: { type: "spring", stiffness: 150, damping: 20 },
          rotateX: { type: "spring", stiffness: 150, damping: 20 }
        }}
        className="relative w-full h-full max-w-[340px] max-h-[340px] flex items-center justify-center perspective-500"
      >
        {/* Glow behind the girl */}
        <motion.div 
          animate={{
            scale: reaction === 'correct' ? [1, 1.25, 1] : reaction === 'incorrect' ? [1, 0.95, 1] : [1, 1.08, 1],
            opacity: reaction === 'correct' ? 0.85 : 0.5
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className={`absolute w-44 h-44 rounded-full filter blur-[40px] z-0 ${
            reaction === 'correct' 
              ? 'bg-gradient-to-r from-green-500/40 to-emerald-400/30' 
              : reaction === 'incorrect'
              ? 'bg-gradient-to-r from-red-500/30 to-violet-500/20'
              : 'bg-gradient-to-r from-primary-500/30 to-violet-500/30'
          }`}
        />

        {/* Serving Girl Image */}
        <motion.img 
          src="/serving_girl.png"
          alt="AI Revision Mentor"
          className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_25px_rgba(139,92,246,0.35)]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Sparkles emerging from the platter area */}
        {sparklesArr.map((_, i) => {
          // Platter center is on the right side of the girl, approx x: 60px, y: -20px relative to center
          const angle = (i / sparklesArr.length) * Math.PI * 2;
          const distance = 40 + Math.random() * 50;
          const targetX = 60 + Math.cos(angle) * distance;
          const targetY = -20 + Math.sin(angle) * distance;

          return (
            <motion.div
              key={i}
              className="absolute z-20 pointer-events-none"
              initial={{ x: 60, y: -20, scale: 0, opacity: 0 }}
              animate={{
                x: [60, targetX],
                y: [-20, targetY],
                scale: [0, 1.3, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.2 + Math.random() * 0.8,
                delay: i * 0.1,
                ease: "easeOut"
              }}
            >
              {reaction === 'correct' ? (
                <Star size={10 + Math.random() * 8} className="text-amber-400 fill-amber-300" />
              ) : (
                <Sparkles size={8 + Math.random() * 6} className="text-primary-300 fill-primary-400/50" />
              )}
            </motion.div>
          );
        })}

        {/* Floating emoji reactions */}
        {reaction === 'correct' && (
          <motion.div
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: [0, 1.4, 1], y: -90, opacity: [1, 1, 0] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute z-30 text-3xl pointer-events-none"
            style={{ top: "25%", right: "20%" }}
          >
            🎉
          </motion.div>
        )}
        
        {reaction === 'incorrect' && (
          <motion.div
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: [0, 1.2, 1], y: -70, opacity: [1, 1, 0] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute z-30 text-3xl pointer-events-none"
            style={{ top: "30%", left: "15%" }}
          >
            💡
          </motion.div>
        )}
      </motion.div>

      {/* Shadow */}
      <div className="w-48 h-3.5 bg-black/40 rounded-full blur-[6px] mt-3 z-0 shrink-0" />
    </div>
  );
};

export default AIAvatar;
