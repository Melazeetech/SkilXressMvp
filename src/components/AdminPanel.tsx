import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { CheckCircle, XCircle, Loader2, Search, User as UserIcon, RefreshCw, Play, Shield, Video, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

type Profile = Database['public']['Tables']['profiles']['Row'];
type SkillVideo = Database['public']['Tables']['skill_videos']['Row'] & {
    provider_id: string;
    public_profiles: {
        full_name: string;
        avatar_url: string | null;
        is_verified?: boolean;
        location?: string | null;
    };
};

export function AdminPanel() {
    const [activeTab, setActiveTab] = useState<'providers' | 'videos'>('providers');
    const [providers, setProviders] = useState<Profile[]>([]);
    const [videos, setVideos] = useState<SkillVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [providerFilter, setProviderFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [videoFilter, setVideoFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    useEffect(() => {
        if (activeTab === 'providers') {
            loadProviders();
        } else {
            loadVideos();
        }
    }, [activeTab]);

    const loadProviders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_type', 'provider')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProviders(data || []);
        } catch (error) {
            console.error('Error loading providers:', error);
            toast.error('Failed to load providers');
        } finally {
            setLoading(false);
        }
    };

    const loadVideos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('skill_videos')
                .select(`
                    *,
                    public_profiles:profiles!skill_videos_provider_id_fkey (
                        full_name,
                        avatar_url,
                        location,
                        is_verified
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVideos(data as any || []);
        } catch (error) {
            console.error('Error loading videos:', error);
            toast.error('Failed to load videos');
        } finally {
            setLoading(false);
        }
    };

    const toggleVerification = async (providerId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                // @ts-ignore
                .update({ is_verified: !currentStatus })
                .eq('id', providerId);

            if (error) throw error;

            setProviders(prev => prev.map(p =>
                p.id === providerId ? { ...p, is_verified: !currentStatus } : p
            ));

            toast.success(`Provider ${!currentStatus ? 'Verified' : 'Unverified'}`);
        } catch (error) {
            console.error('Error toggling verification:', error);
            toast.error('Action failed');
        }
    };

    const updateVideoStatus = async (videoId: string, status: 'approved' | 'rejected') => {
        try {
            console.log(`AdminPanel: Attempting to update video ${videoId} status to ${status}...`);

            // 1. Update the video status in skill_videos table
            // @ts-ignore
            const { data: updatedData, error: updateError } = await supabase
                .from('skill_videos')
                .update({ status: status } as any) // Use 'as any' if type gen is strictly following old schema
                .eq('id', videoId)
                .select();

            if (updateError) {
                console.error('AdminPanel: Supabase update error:', updateError);
                throw updateError;
            }

            if (!updatedData || updatedData.length === 0) {
                console.warn('AdminPanel: Update succeeded but no rows were affected. This is likely an RLS permission issue.');
                toast.error('Update failed: Permission denied or video not found');
                return;
            }

            console.log('AdminPanel: Successfully updated video in DB:', updatedData[0]);

            // 2. Also update or create a record in the video_moderation history table
            try {
                const { error: modError } = await supabase
                    .from('video_moderation')
                    .upsert({
                        video_id: videoId,
                        status: status,
                        moderated_at: new Date().toISOString(),
                        moderated_by: 'Admin Panel',
                        moderation_reason: 'Manual review by administrator'
                    } as any);
                if (modError) console.warn('AdminPanel: Failed to update moderation history:', modError);
            } catch (e) {
                console.warn('AdminPanel: Moderation history update error:', e);
            }

            // 3. Update local state
            setVideos(prev => prev.map(v =>
                v.id === videoId ? { ...v, status } : v
            ));

            // 4. Send notification to provider
            try {
                const video = videos.find(v => v.id === videoId);
                if (video) {
                    console.log(`AdminPanel: Sending notification to provider ${video.provider_id}...`);
                    await supabase.from('notifications').insert({
                        user_id: video.provider_id,
                        type: 'video_approval',
                        title: status === 'approved' ? 'Video Approved! 🎥' : 'Video Update',
                        message: status === 'approved'
                            ? `Your video "${video.title}" has been approved and is now live!`
                            : `Your video "${video.title}" was not approved at this time.`,
                        data: { video_id: videoId, status }
                    } as any);
                }
            } catch (notificationError) {
                console.warn('AdminPanel: Background notification failed:', notificationError);
            }

            toast.success(`Video ${status.charAt(0).toUpperCase() + status.slice(1)}`);
        } catch (error) {
            console.error('Error updating video status:', error);
            toast.error('Action failed. Check your admin permissions.');
        }
    };

    const filteredProviders = providers.filter(p => {
        const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase());

        if (providerFilter === 'verified') return matchesSearch && p.is_verified;
        if (providerFilter === 'unverified') return matchesSearch && !p.is_verified;
        return matchesSearch;
    });

    const filteredVideos = videos.filter(v => {
        const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.public_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

        if (videoFilter === 'all') return (matchesSearch ?? false);
        return (matchesSearch ?? false) && (v as any).status === videoFilter;
    });

    return (
        <div className="min-h-screen bg-primary font-balthazar pt-20 pb-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-black flex items-center gap-3">
                            Admin Control Panel
                            <span className="text-sm font-normal bg-secondary-cyan/10 text-secondary-cyan px-3 py-1 rounded-full border border-secondary-cyan/20">
                                {activeTab === 'providers' ? 'Verification Hub' : 'Video Moderation'}
                            </span>
                        </h1>
                        <p className="text-secondary-black/60 mt-1">
                            {activeTab === 'providers'
                                ? 'Manage and verify service providers on the platform.'
                                : 'Review and approve uploaded skill videos.'}
                        </p>
                    </div>
                    <button
                        onClick={activeTab === 'providers' ? loadProviders : loadVideos}
                        className="flex items-center gap-2 bg-secondary-black text-white px-4 py-2 rounded-lg hover:bg-secondary-black/80 transition-all font-bold"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('providers')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'providers'
                            ? 'bg-secondary-black text-white shadow-lg'
                            : 'bg-white text-secondary-black hover:bg-secondary-black/5'
                            }`}
                    >
                        <Shield className="w-5 h-5" />
                        Provider Verification
                    </button>
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'videos'
                            ? 'bg-secondary-black text-white shadow-lg'
                            : 'bg-white text-secondary-black hover:bg-secondary-black/5'
                            }`}
                    >
                        <Video className="w-5 h-5" />
                        Video Approval
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-2xl shadow-sm border border-secondary-black/5 p-4 mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-black/30" />
                        <input
                            type="text"
                            placeholder={activeTab === 'providers' ? "Search by name or email..." : "Search by title or provider..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-secondary-black/10 focus:outline-none focus:ring-2 focus:ring-secondary-orange/20 focus:border-secondary-orange transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        {activeTab === 'providers' ? (
                            (['all', 'verified', 'unverified'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setProviderFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${providerFilter === f
                                        ? 'bg-secondary-orange text-white shadow-lg shadow-secondary-orange/20'
                                        : 'bg-secondary-black/5 text-secondary-black hover:bg-secondary-black/10'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))
                        ) : (
                            (['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setVideoFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${videoFilter === f
                                        ? 'bg-secondary-orange text-white shadow-lg shadow-secondary-orange/20'
                                        : 'bg-secondary-black/5 text-secondary-black hover:bg-secondary-black/10'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-secondary-cyan animate-spin mb-4" />
                        <p className="text-secondary-black/40 font-bold animate-pulse">Syncing Data...</p>
                    </div>
                ) : activeTab === 'providers' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-secondary-black/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary-black/5">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider">Provider</th>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider">Contact & Location</th>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider text-center">Status</th>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-black/5">
                                    {filteredProviders.map((provider) => (
                                        <tr key={provider.id} className="hover:bg-secondary-cyan/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-orange to-secondary-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-sm">
                                                        {provider.avatar_url ? (
                                                            <img src={provider.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            provider.full_name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-secondary-black flex items-center gap-1">
                                                            {provider.full_name}
                                                            {provider.is_verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />}
                                                        </div>
                                                        <div className="text-xs text-secondary-black/40 capitalize">{provider.specialty || 'General Service'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="text-secondary-black font-medium">{provider.email}</div>
                                                <div className="text-secondary-black/40 text-xs">{provider.location || 'Unknown Location'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    {provider.is_verified ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold ring-1 ring-green-600/20">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold ring-1 ring-amber-600/20">
                                                            <XCircle className="w-3 h-3" />
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => toggleVerification(provider.id, provider.is_verified || false)}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${provider.is_verified
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                        : 'bg-secondary-black text-white hover:bg-secondary-black/80 shadow-md'
                                                        }`}
                                                >
                                                    {provider.is_verified ? 'Revoke' : 'Verify Now'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProviders.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center opacity-30">
                                                    <UserIcon className="w-12 h-12 mb-2" />
                                                    <p className="font-bold">No matching providers found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVideos.map((video) => (
                            <div key={video.id} className="bg-white rounded-2xl shadow-sm border border-secondary-black/5 overflow-hidden flex flex-col">
                                <div className="relative aspect-video group">
                                    <video
                                        src={video.video_url}
                                        className="w-full h-full object-cover"
                                        poster={video.thumbnail_url || undefined}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={(e) => {
                                                const v = e.currentTarget.parentElement?.previousElementSibling as HTMLVideoElement;
                                                if (v.paused) v.play(); else v.pause();
                                            }}
                                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-secondary-black shadow-lg"
                                        >
                                            <Play className="w-6 h-6 fill-current" />
                                        </button>
                                    </div>
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                                            // @ts-ignore
                                            video.status === 'approved' ? 'bg-green-500 text-white' :
                                                // @ts-ignore
                                                video.status === 'rejected' ? 'bg-red-500 text-white' :
                                                    'bg-yellow-500 text-white'
                                            }`}>
                                            {/* @ts-ignore */}
                                            {video.status || 'pending'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-secondary-black/10 flex items-center justify-center overflow-hidden">
                                            {video.public_profiles?.avatar_url ? (
                                                <img src={video.public_profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-4 h-4 text-secondary-black/40" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-secondary-black truncate">{video.public_profiles?.full_name}</div>
                                            <div className="text-[10px] text-secondary-black/40 uppercase font-bold tracking-tight">Provider</div>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-secondary-black mb-1 line-clamp-1">{video.title}</h3>
                                    <p className="text-xs text-secondary-black/60 line-clamp-2 mb-4">{video.description || 'No description provided.'}</p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateVideoStatus(video.id, 'approved')}
                                            // @ts-ignore
                                            disabled={video.status === 'approved'}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition-all disabled:opacity-50 disabled:grayscale shadow-md shadow-green-500/10"
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => updateVideoStatus(video.id, 'rejected')}
                                            // @ts-ignore
                                            disabled={video.status === 'rejected'}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-50 disabled:grayscale shadow-md shadow-red-500/10"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredVideos.length === 0 && (
                            <div className="col-span-full py-20 bg-white rounded-2xl border border-secondary-black/5 text-center">
                                <Video className="w-12 h-12 mx-auto mb-2 opacity-10" />
                                <p className="font-bold opacity-30">No videos found in this queue</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
