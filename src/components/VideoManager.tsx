import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Video, Play, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

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
        const { data } = await supabase.from('skill_categories').select('*').order('name');
        setCategories(data || []);
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
                <VideoUploadForm
                    categories={categories}
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

function VideoUploadForm({
    categories,
    onClose,
    onSuccess,
}: {
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoPreview, setVideoPreview] = useState<string>('');
    const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { user } = useAuth();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            const previewUrl = URL.createObjectURL(file);
            setVideoPreview(previewUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setUploadProgress(0);

        try {
            let finalVideoUrl = videoUrl;

            if (uploadMethod === 'file' && videoFile) {
                const { uploadVideo } = await import('../lib/uploadHelpers');
                finalVideoUrl = await uploadVideo(videoFile, user.id, (progress) => {
                    setUploadProgress(progress);
                });
            }

            const { error } = await supabase.from('skill_videos').insert({
                provider_id: user.id,
                category_id: categoryId,
                video_url: finalVideoUrl,
                title,
                description: description || null,
                status: 'pending',
                moderation_status: 'pending'
            } as any);

            if (error) throw error;

            if (videoPreview) {
                URL.revokeObjectURL(videoPreview);
            }

            toast.success('Video uploaded successfully');
            onSuccess();
        } catch (error) {
            console.error('Error uploading video:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload video');
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Upload Video</h2>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Method</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setUploadMethod('file')}
                                className={`px-4 py-2.5 rounded-xl border font-medium transition-all ${uploadMethod === 'file'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                Upload File
                            </button>
                            <button
                                type="button"
                                onClick={() => setUploadMethod('url')}
                                className={`px-4 py-2.5 rounded-xl border font-medium transition-all ${uploadMethod === 'url'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                Use URL
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Modern Haircut Tutorial"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Brief description..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {uploadMethod === 'file' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    required={uploadMethod === 'file'}
                                />
                                {videoPreview ? (
                                    <video src={videoPreview} className="max-h-48 mx-auto rounded-lg" controls />
                                ) : (
                                    <div className="py-2">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Click to upload video</p>
                                        <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV (Max 50MB)</p>
                                    </div>
                                )}
                            </div>
                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Uploading...</span>
                                        <span>{Math.round(uploadProgress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Video URL or TikTok Link
                            </label>
                            <input
                                type="url"
                                value={videoUrl}
                                onChange={async (e) => {
                                    const url = e.target.value;
                                    setVideoUrl(url);

                                    // Auto-detect TikTok links
                                    if (url.includes('tiktok.com')) {
                                        const { isTikTokUrl, getTikTokMetadata } = await import('../lib/tiktokHelpers');

                                        if (isTikTokUrl(url)) {
                                            // Try to fetch metadata
                                            const metadata = await getTikTokMetadata(url);
                                            if (metadata) {
                                                if (!title && metadata.title) {
                                                    setTitle(metadata.title);
                                                }
                                                if (!description && metadata.author_name) {
                                                    setDescription(`Video by ${metadata.author_name}`);
                                                }
                                            }
                                        }
                                    }
                                }}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://www.tiktok.com/@username/video/... or direct video URL"
                                required={uploadMethod === 'url'}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                ✨ Supports TikTok links, direct video URLs, YouTube, and more!
                            </p>
                            {videoUrl && videoUrl.includes('tiktok.com') && (
                                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-purple-600 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                                        </svg>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-purple-900">TikTok Link Detected!</p>
                                            <p className="text-xs text-purple-700 mt-0.5">
                                                We'll embed this video from TikTok. No upload needed!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {uploadProgress > 0 ? 'Uploading...' : 'Saving...'}
                                </>
                            ) : (
                                'Upload Video'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
