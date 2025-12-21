export function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-secondary-black z-[100] flex flex-col items-center justify-center">
            {/* Background Blobs */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-secondary-cyan/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary-orange/10 rounded-full blur-[100px] animate-pulse transition-all duration-1000" />

            <div className="relative flex flex-col items-center">
                {/* Logo Container with floating effect */}
                <div className="w-24 h-24 mb-6 relative group">
                    <div className="absolute inset-0 bg-secondary-cyan/20 blur-2xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-500" />
                    <img
                        src="/logo.png"
                        alt="SkilXpress"
                        className="w-full h-full object-contain relative z-10 animate-bounce-slow"
                    />
                </div>

                {/* Text Section */}
                <div className="text-center space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter">
                        Skil<span className="text-secondary-cyan">X</span>press
                    </h1>
                    <div className="flex items-center gap-2 justify-center">
                        <div className="h-px w-8 bg-white/20" />
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.3em]">
                            Loading Experience
                        </p>
                        <div className="h-px w-8 bg-white/20" />
                    </div>
                </div>

                {/* Modern Progress Line */}
                <div className="mt-12 w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary-cyan to-transparent w-full h-full -translate-x-full animate-shimmer" />
                </div>
            </div>
        </div>
    );
}
