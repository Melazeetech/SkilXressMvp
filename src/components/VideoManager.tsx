import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Video, Play, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { VideoUploadModal } from './VideoUploadModal';

type SkillVideo = Database['public']['Tables']['skill_videos']['Row'] & {
    skill_categories: {
        name: string;
    };
};

type Category = Database['public']['Tables']['skill_categories']['Row'];

export function VideoManager() {
    const { user } = useAuth();
    const [videos, setVideos] = useState<SkillVideo[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (user) {
            loadVideos();
            loadCategories();
        }
    }, [user]);

    const loadVideos = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('skill_videos')
                .select(`
                    *,
                    skill_categories (name)
                `)
                .eq('provider_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVideos(data || []);
        } catch (error) {
            console.error('Error loading videos:', error);
            toast.error('Failed to load videos');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        // Categories are now handled inside VideoUploadModal
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

        setDeletingId(id);
        try {
            const { error } = await supabase
                .from('skill_videos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setVideos(videos.filter(v => v.id !== id));
            toast.success('Video deleted successfully');
        } catch (error) {
            console.error('Error deleting video:', error);
            toast.error('Failed to delete video');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">My Videos</h2>
                <button
                    onClick={() => setIsUploading(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Video
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                    <div key={video.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="aspect-[9/16] bg-black relative">
                            <video
                                src={video.video_url}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                muted
                                loop
                                playsInline
                                onMouseOver={e => e.currentTarget.play()}
                                onMouseOut={e => {
                                    e.currentTarget.pause();
                                    e.currentTarget.currentTime = 0;
                                }}
                            />

                            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDelete(video.id, video.title)}
                                    disabled={deletingId === video.id}
                                    className="p-2 bg-white/90 text-red-600 rounded-full hover:bg-red-50 backdrop-blur-sm shadow-sm transition-colors"
                                >
                                    {deletingId === video.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Play className="w-5 h-5 text-white fill-current ml-1" />
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="absolute bottom-2 right-2">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${video.status === 'approved' ? 'bg-green-500 text-white' :
                                    video.status === 'rejected' ? 'bg-red-500 text-white' :
                                        'bg-yellow-500 text-white'
                                    }`}>
                                    {video.status || 'pending'}
                                </span>
                            </div>
                        </div>

                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 line-clamp-1" title={video.title}>
                                {video.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 mb-3">
                                <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                                    {video.skill_categories?.name || 'Uncategorized'}
                                </span>
                                <span>•</span>
                                <span>{new Date(video.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 h-10">
                                {video.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>
                ))}

                {videos.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No videos yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                            Upload videos to showcase your skills and attract clients.
                        </p>
                        <button
                            onClick={() => setIsUploading(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Upload First Video
                        </button>
                    </div>
                )}
            </div>

            {isUploading && (
                <VideoUploadModal
                    isOpen={isUploading}
                    onClose={() => setIsUploading(false)}
                    onSuccess={() => {
                        setIsUploading(false);
                        loadVideos();
                    }}
                />
            )}
        </div>
    );
}

