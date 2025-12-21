import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    className?: string;
    variant?: 'text' | 'circle' | 'rectangle';
}

export function Skeleton({ className = '', variant = 'rectangle', ...props }: SkeletonProps) {
    const baseClasses = "animate-pulse bg-secondary-black/10";

    const variantClasses = {
        text: "h-4 w-full rounded",
        circle: "rounded-full",
        rectangle: "rounded-xl"
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            {...props}
        />
    );
}

export function VideoSkeleton() {
    return (
        <div className="h-screen w-full bg-black relative flex items-center justify-center overflow-hidden">
            {/* Background Pulse */}
            <div className="absolute inset-0 bg-secondary-black/20 animate-pulse" />

            {/* Right Side Actions Skeleton */}
            <div className="absolute top-1/2 -translate-y-[40%] right-4 flex flex-col items-center gap-5 z-20">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                        <Skeleton variant="circle" className="w-12 h-12 bg-white/10" />
                        <Skeleton variant="text" className="w-8 h-2 bg-white/10" />
                    </div>
                ))}
            </div>

            {/* Bottom Info Section Skeleton */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-12 text-white z-10">
                <div className="flex items-center mb-6">
                    <Skeleton variant="circle" className="w-12 h-12 mr-3 bg-white/20" />
                    <div className="space-y-2">
                        <Skeleton variant="text" className="w-32 h-4 bg-white/20" />
                        <Skeleton variant="text" className="w-20 h-3 bg-white/10" />
                    </div>
                </div>
                <Skeleton variant="text" className="w-3/4 h-6 mb-2 bg-white/20" />
                <Skeleton variant="text" className="w-1/2 h-4 bg-white/10" />
            </div>
        </div>
    );
}

export function DashboardCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-black/5 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Skeleton variant="circle" className="w-12 h-12 mr-4" />
                    <div className="space-y-2">
                        <Skeleton variant="text" className="w-32 h-4" />
                        <Skeleton variant="text" className="w-24 h-3" />
                    </div>
                </div>
                <Skeleton variant="rectangle" className="w-20 h-6" />
            </div>
            <div className="space-y-2 mb-4">
                <Skeleton variant="text" className="w-full h-3" />
                <Skeleton variant="text" className="w-2/3 h-3" />
            </div>
            <div className="flex gap-3">
                <Skeleton variant="rectangle" className="w-24 h-10" />
                <Skeleton variant="rectangle" className="w-24 h-10" />
            </div>
        </div>
    );
}
