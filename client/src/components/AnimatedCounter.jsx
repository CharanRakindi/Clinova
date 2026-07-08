import { useEffect, useState, useRef } from 'react';

const AnimatedCounter = ({ value, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const target = Number(value) || 0;

  useEffect(() => {
    let startTime = null;
    let animationFrame;
    const startValue = countRef.current;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeProgress = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      const currentCount = Math.floor(startValue + (target - startValue) * easeProgress);
      setCount(currentCount);
      countRef.current = currentCount;

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [target, duration]);

  return <span>{count}</span>;
};

export default AnimatedCounter;
