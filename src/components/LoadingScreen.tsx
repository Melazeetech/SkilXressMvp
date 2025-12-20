import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center">
                {/* Logo Container */}
                <div className="w-32 h-32 flex items-center justify-center mb-6 animate-pulse">
                    <img src="/logo.png" alt="SkilXpress Logo" className="w-full h-full object-contain" />
                </div>

                {/* Text */}
                <div className="text-center font-balthazar">
                    <h1 className="text-3xl font-bold text-secondary-black tracking-tight mb-2">
                        SkilXpress
                    </h1>
                    <p className="text-secondary-orange font-medium animate-pulse">
                        connecting talent with demand
                    </p>
                </div>

                {/* Loading Spinner */}
                <div className="mt-8">
                    <Loader2 className="w-8 h-8 text-secondary-cyan animate-spin" />
                </div>
            </div>
        </div>
    );
}
