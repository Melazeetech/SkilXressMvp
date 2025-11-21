import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeartOverlayProps {
    x: number;
    y: number;
    onComplete: () => void;
}

export function HeartOverlay({ x, y, onComplete }: HeartOverlayProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Start animation immediately
        requestAnimationFrame(() => setIsAnimating(true));

        // Cleanup after animation duration
        const timer = setTimeout(onComplete, 1000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div
            className={`absolute pointer-events-none z-30 transition-all duration-700 ease-out transform ${isAnimating
                    ? 'opacity-0 -translate-y-20 scale-150'
                    : 'opacity-100 scale-0'
                }`}
            style={{
                left: x - 48, // Center the 96px heart
                top: y - 48,
            }}
        >
            <Heart
                className="w-24 h-24 fill-red-500 text-red-500 drop-shadow-lg rotate-[-15deg]"
                strokeWidth={0}
            />
        </div>
    );
}
