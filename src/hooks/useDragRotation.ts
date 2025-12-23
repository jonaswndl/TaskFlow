import { useEffect, useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

export const useDragRotation = (isDragging: boolean) => {
  const [rotation, setRotation] = useState(0);
  const lastPosition = useRef<Position>({ x: 0, y: 0 });
  const lastTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!isDragging) {
      setRotation(0);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime.current;
      
      if (deltaTime < 16) return; // Throttle to ~60fps

      const deltaX = e.clientX - lastPosition.current.x;
      const velocity = deltaX / deltaTime;

      // Rotation based on velocity (moving right = tilt left, moving left = tilt right)
      const newRotation = Math.max(-15, Math.min(15, -velocity * 100));
      
      setRotation(newRotation);
      
      lastPosition.current = { x: e.clientX, y: e.clientY };
      lastTime.current = currentTime;
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging]);

  return rotation;
};
