import { X, Copy, Check, Share2 } from 'lucide-react';
import { useState } from 'react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoId: string;
    videoTitle: string;
}

export function ShareModal({ isOpen, onClose, videoId, videoTitle }: ShareModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const shareUrl = `${window.location.origin}?video=${videoId}`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(videoTitle);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy link');
        }
    };

    const shareOptions = [
        {
            name: 'WhatsApp',
            icon: '💬',
            url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            color: 'bg-green-500 hover:bg-green-600',
        },
        {
            name: 'Twitter',
            icon: '🐦',
            url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
            color: 'bg-blue-400 hover:bg-blue-500',
        },
        {
            name: 'Facebook',
            icon: '👥',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: 'bg-blue-600 hover:bg-blue-700',
        },
        {
            name: 'LinkedIn',
            icon: '💼',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            color: 'bg-blue-700 hover:bg-blue-800',
        },
    ];

    const handleShare = (url: string) => {
        window.open(url, '_blank', 'width=600,height=400');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-bold">Share Video</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Copy Link */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Share Link
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                        />
                        <button
                            onClick={handleCopyLink}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${copied
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span className="text-sm">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span className="text-sm">Copy</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Social Share Options */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Share via
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {shareOptions.map((option) => (
                            <button
                                key={option.name}
                                onClick={() => handleShare(option.url)}
                                className={`${option.color} text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg`}
                            >
                                <span className="text-xl">{option.icon}</span>
                                <span>{option.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Native Share (if available) */}
                {navigator.share && (
                    <button
                        onClick={() => {
                            navigator.share({
                                title: videoTitle,
                                url: shareUrl,
                            }).catch((error) => {
                                if (error.name !== 'AbortError') {
                                    console.error('Error sharing:', error);
                                }
                            });
                        }}
                        className="w-full mt-4 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        <span>More Options</span>
                    </button>
                )}
            </div>
        </div>
    );
}
