import { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
import { uploadVideo } from '../lib/uploadHelpers';
import { isTikTokUrl, getTikTokMetadata } from '../lib/tiktokHelpers';

type Category = Database['public']['Tables']['skill_categories']['Row'];

interface VideoUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function VideoUploadModal({ isOpen, onClose, onSuccess }: VideoUploadModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoPreview, setVideoPreview] = useState<string>('');
    const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            loadCategories();
        }
    }, [isOpen]);

    const loadCategories = async () => {
        const { data } = await supabase.from('skill_categories').select('*').order('name');
        setCategories(data || []);
    };

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
                status: 'pending'
            } as any);

            if (error) throw error;

            if (videoPreview) {
                URL.revokeObjectURL(videoPreview);
            }

            toast.success('Video uploaded successfully and is pending approval');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error uploading video:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload video');
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 my-8 max-h-[90vh] overflow-y-auto shadow-2xl relative">
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

                                    if (url.includes('tiktok.com')) {
                                        if (isTikTokUrl(url)) {
                                            const metadata = await getTikTokMetadata(url);
                                            if (metadata) {
                                                if (!title && metadata.title) setTitle(metadata.title);
                                                if (!description && metadata.author_name) setDescription(`Video by ${metadata.author_name}`);
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
