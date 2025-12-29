import { useState, useEffect } from 'react';
import { X, User, Calendar, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface VideoViewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoId: string;
    onProfileClick: (userId: string) => void;
}

interface Viewer extends Profile {
    viewed_at: string;
}

export function VideoViewsModal({ isOpen, onClose, videoId, onProfileClick }: VideoViewsModalProps) {
    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && videoId) {
            loadViewers();
        }
    }, [isOpen, videoId]);

    const loadViewers = async () => {
        try {
            setLoading(true);
            console.log('Fetching views for video:', videoId);

            // Try fetching with the specific constraint name we created
            const { data, error } = await supabase
                .from('video_views')
                .select(`
          viewed_at,
          user:profiles!video_views_user_id_fkey_profiles (
            *
          )
        `)
                .eq('video_id', videoId)
                .order('viewed_at', { ascending: false });

            if (error) {
                console.error('Supabase error fetching views:', error);
                throw error;
            }

            console.log('Raw views data:', data);

            const formattedViewers = data.map((item: any) => ({
                ...item.user,
                viewed_at: item.viewed_at
            })).filter((viewer: any) => viewer && viewer.full_name); // Filter out any null users

            console.log('Formatted viewers:', formattedViewers);
            setViewers(formattedViewers);
        } catch (error) {
            console.error('Error loading viewers:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                    <h3 className="font-bold text-lg">Video Views</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : viewers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No views yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {viewers.map((viewer) => (
                                <div
                                    key={`${viewer.id}-${viewer.viewed_at}`}
                                    onClick={() => {
                                        onProfileClick(viewer.id);
                                        onClose();
                                    }}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                                >
                                    {viewer.avatar_url ? (
                                        <img
                                            src={viewer.avatar_url}
                                            alt={viewer.full_name}
                                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                            {viewer.full_name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate">{viewer.full_name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(viewer.viewed_at).toLocaleDateString()}
                                            </span>
                                            {viewer.location && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 truncate">
                                                        <MapPin className="w-3 h-3" />
                                                        {viewer.location}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
