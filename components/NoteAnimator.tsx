
import React, { useState, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NoteAnalysis, AnimationSettings } from '../types';

interface NoteAnimatorProps {
  analysis: NoteAnalysis;
  imageUrl: string; 
  replayKey?: number;
  settings: AnimationSettings;
  aspectRatio: number;
  onComplete?: () => void;
}

const NoteAnimator = forwardRef<HTMLDivElement, NoteAnimatorProps>(({ 
  analysis, 
  imageUrl, 
  replayKey = 0, 
  settings,
  aspectRatio,
  onComplete 
}, ref) => {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    setRevealedCount(0);
    const startDelay = setTimeout(() => {
      setRevealedCount(1);
    }, 200);
    return () => clearTimeout(startDelay);
  }, [replayKey, analysis]);

  useEffect(() => {
    if (revealedCount > 0 && revealedCount < analysis.segments.length) {
      const timer = setTimeout(() => {
        setRevealedCount(prev => prev + 1);
      }, settings.interval); 
      return () => clearTimeout(timer);
    } else if (revealedCount >= analysis.segments.length && onComplete) {
      onComplete();
    }
  }, [revealedCount, analysis.segments.length, onComplete, settings.interval]);

  return (
    <div 
      ref={ref}
      className="relative w-full bg-white overflow-hidden rounded-xl"
      style={{ aspectRatio: `${aspectRatio}` }}
    >
      {/* Texture / Paper Background */}
      <div className="absolute inset-0 z-0 bg-white" />
      <div className="absolute inset-0 z-1 opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: `radial-gradient(#000 0.5px, transparent 0.5px)`, 
             backgroundSize: '20px 20px' 
           }} 
      />
      
      {/* Ghosting layer */}
      <div 
        className="absolute inset-0 z-5 pointer-events-none transition-opacity duration-500"
        style={{ 
          opacity: settings.ghosting * 0.1,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: '100% 100%',
          filter: 'grayscale(100%) brightness(1.2)'
        }}
      />

      {/* Ink Reveal Layer */}
      {/* Instead of multiple images, we use a single full-size image with CSS masks for each revealed word */}
      <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        {analysis.segments.map((segment, index) => {
          const [ymin, xmin, ymax, xmax] = segment.box_2d;
          const top = ymin / 10;
          const left = xmin / 10;
          const width = (xmax - xmin) / 10;
          const height = (ymax - ymin) / 10;

          return (
            <motion.div
              key={`${index}-${replayKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: index < revealedCount ? 1 : 0 }}
              transition={{ duration: settings.duration, ease: "linear" }}
              className="absolute overflow-hidden"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: `${width}%`,
                height: `${height}%`,
              }}
            >
              <div 
                className="absolute"
                style={{
                  top: `-${(top / height) * 100}%`,
                  left: `-${(left / width) * 100}%`,
                  width: `${100 / (width / 100)}%`,
                  height: `${100 / (height / 100)}%`,
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat'
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

export default NoteAnimator;
