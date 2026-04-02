import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { motion, useScroll, useSpring } from 'motion/react';

export const ScrollProgress = ({ className }: { className?: string }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className={cn('fixed top-0 left-0 right-0 z-[100] h-1 bg-blue-600 origin-left', className)}
      style={{ scaleX }}
    />
  );
};
