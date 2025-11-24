import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center">
                {/* Logo Container */}
                <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 animate-bounce">
                    <span className="text-6xl font-black text-white font-sans">S</span>
                </div>

                {/* Text */}
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2 animate-pulse">
                    SkilXpress
                </h1>

                {/* Loading Spinner */}
                <div className="mt-8">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            </div>
        </div>
    );
}
