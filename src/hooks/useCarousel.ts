import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for carousel/slider functionality
 */
export function useCarousel(itemCount: number, autoPlayInterval: number = 5000) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Auto-advance carousel
    useEffect(() => {
        if (!isAutoPlaying || itemCount === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % itemCount);
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [isAutoPlaying, itemCount, autoPlayInterval]);

    const next = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % itemCount);
        setIsAutoPlaying(false);
    }, [itemCount]);

    const prev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + itemCount) % itemCount);
        setIsAutoPlaying(false);
    }, [itemCount]);

    const goTo = useCallback((index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
    }, []);

    const pauseAutoPlay = useCallback(() => {
        setIsAutoPlaying(false);
    }, []);

    const resumeAutoPlay = useCallback(() => {
        setIsAutoPlaying(true);
    }, []);

    return {
        currentIndex,
        next,
        prev,
        goTo,
        pauseAutoPlay,
        resumeAutoPlay,
        isAutoPlaying,
    };
}
