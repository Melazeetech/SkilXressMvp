import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type WorkSample = Database['public']['Tables']['work_samples']['Row'];

export function PortfolioManager() {
    const { user } = useAuth();
    const [samples, setSamples] = useState<WorkSample[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadSamples();
        }
    }, [user]);

    const loadSamples = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('work_samples')
                .select('*')
                .eq('provider_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSamples(data || []);
        } catch (error) {
            console.error('Error loading portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !imageFile || !title) return;

        setUploading(true);
        try {
            // 1. Upload image
            // We'll use a specific path in 'avatars' for now if we don't have a portfolio bucket, 
            // OR better, let's just use the 'avatars' bucket but organize it? 
            // Actually, let's check if we can create a 'portfolio' bucket easily. 
            // For MVP, using 'avatars' bucket is "okay" but semantically wrong. 
            // Let's try to use `uploadAvatar` but maybe modify it or just use the logic here.
            // Actually, I'll import `uploadPortfolioImage` which I will add to helpers in a moment.
            // For now, I'll define the logic inline or assume the helper exists.

            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${user.id}/${Math.random()}.${fileExt}`;
            const filePath = `portfolio/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars') // Reusing avatars bucket for now as it's public images
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 2. Insert record
            const { data, error } = await supabase
                .from('work_samples')
                .insert([
                    {
                        provider_id: user.id,
                        title,
                        description,
                        image_url: publicUrl,
                    }
                ] as any)
                .select()
                .single();

            if (error) throw error;

            setSamples([data, ...samples]);
            setIsAdding(false);
            resetForm();
        } catch (error) {
            console.error('Error adding work sample:', error);
            alert('Failed to add work sample');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            // Delete from DB
            const { error } = await supabase
                .from('work_samples')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Try to delete from storage (optional but good practice)
            // Extract path from URL... simplified for now

            setSamples(samples.filter(s => s.id !== id));
        } catch (error) {
            console.error('Error deleting sample:', error);
            alert('Failed to delete item');
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setImageFile(null);
        setImagePreview(null);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Portfolio</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Work Sample
                </button>
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Add to Portfolio</h3>
                            <button onClick={() => { setIsAdding(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="Project Title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    rows={3}
                                    placeholder="Brief description of the work..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                                    ) : (
                                        <div className="py-4">
                                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Click to upload image</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); resetForm(); }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || !imageFile}
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {uploading ? 'Uploading...' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {samples.map((sample) => (
                    <div key={sample.id} className="group relative bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-gray-100 relative overflow-hidden">
                            <img
                                src={sample.image_url}
                                alt={sample.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <button
                                    onClick={() => handleDelete(sample.id)}
                                    className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1">{sample.title}</h3>
                            {sample.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">{sample.description}</p>
                            )}
                        </div>
                    </div>
                ))}
                {samples.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No portfolio items</h3>
                        <p className="text-gray-500">Start building your portfolio by adding work samples.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
