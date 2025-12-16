import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // Check if running in standalone mode (already installed)
        const checkStandalone = () => {
            const isStandaloneMode =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone ||
                document.referrer.includes('android-app://');

            setIsStandalone(isStandaloneMode);
        };

        checkStandalone();

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIOSDevice);

        // Handle beforeinstallprompt for Android/Desktop
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // If iOS and not standalone, it's "installable" via manual steps
        if (isIOSDevice && !isStandalone) {
            setIsInstallable(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [isStandalone]);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsInstallable(false);
            }
        }
    };

    if (!isInstallable || isStandalone) {
        return null;
    }

    return (
        <>
            <button
                onClick={handleInstallClick}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-blue-100 hover:border-blue-600 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
                <Download className="w-5 h-5" />
                Install App
            </button>

            {/* iOS Instructions Modal */}
            {showIOSInstructions && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300">
                        <button
                            onClick={() => setShowIOSInstructions(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                <Download className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Install SkilXpress</h3>
                            <p className="text-gray-600 mt-2 text-sm">
                                Install our app on your home screen for a better experience.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <Share className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="text-sm text-gray-700">
                                    <span className="font-semibold">1.</span> Tap the <span className="font-semibold">Share</span> button in the menu bar.
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <PlusSquare className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="text-sm text-gray-700">
                                    <span className="font-semibold">2.</span> Scroll down and tap <span className="font-semibold">Add to Home Screen</span>.
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="bg-white p-2 rounded-lg shadow-sm text-sm font-bold text-blue-600 px-3 py-1">
                                    Add
                                </div>
                                <div className="text-sm text-gray-700">
                                    <span className="font-semibold">3.</span> Tap <span className="font-semibold">Add</span> in the top right corner.
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setShowIOSInstructions(false)}
                                className="text-blue-600 font-medium text-sm hover:underline"
                            >
                                Close Instructions
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
