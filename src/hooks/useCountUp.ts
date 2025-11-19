import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for animated count-up effect
 * Triggers animation when element scrolls into view
 */
export function useCountUp(end: number, duration: number = 2000) {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    const startTime = Date.now();

                    const animate = () => {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);

                        // Easing function for smooth animation
                        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                        setCount(Math.floor(easeOutQuart * end));

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            setHasAnimated(true);
                        }
                    };

                    animate();
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [end, duration, hasAnimated]);

    return { count, ref };
}
