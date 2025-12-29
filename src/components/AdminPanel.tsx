import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { CheckCircle, XCircle, Loader2, Search, User as UserIcon, RefreshCw, Play, Shield, Video, Check, X, ArrowLeft, BarChart3, Calendar, Users, MessageSquare, Star, Eye, TrendingUp, Layout, Plus } from 'lucide-react';
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

export function AdminPanel({ onBack }: { onBack?: () => void }) {
    const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'clients' | 'videos' | 'bookings' | 'moderation' | 'categories'>('overview');
    const [providers, setProviders] = useState<Profile[]>([]);
    const [clients, setClients] = useState<Profile[]>([]);
    const [videos, setVideos] = useState<SkillVideo[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', icon: 'Tool' });
    const [stats, setStats] = useState<{
        totalProviders: number;
        totalClients: number;
        totalVideos: number;
        totalBookings: number;
        totalViews: number;
    }>({
        totalProviders: 0,
        totalClients: 0,
        totalVideos: 0,
        totalBookings: 0,
        totalViews: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [providerFilter, setProviderFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [videoFilter, setVideoFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

    useEffect(() => {
        if (activeTab === 'overview') {
            loadStats();
        } else if (activeTab === 'providers') {
            loadProviders();
        } else if (activeTab === 'clients') {
            loadClients();
        } else if (activeTab === 'videos') {
            loadVideos();
        } else if (activeTab === 'bookings') {
            loadBookings();
        } else if (activeTab === 'moderation') {
            loadModerationData();
        } else if (activeTab === 'categories') {
            loadCategories();
        }
    }, [activeTab]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const [
                { count: providerCount },
                { count: clientCount },
                { count: videoCount },
                { count: bookingCount },
                { data: viewsData }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'provider'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'client'),
                supabase.from('skill_videos').select('*', { count: 'exact', head: true }),
                supabase.from('bookings').select('*', { count: 'exact', head: true }),
                supabase.from('skill_videos').select('views_count')
            ]);

            const totalViews = (viewsData || []).reduce((acc, curr) => acc + (curr.views_count || 0), 0);

            setStats({
                totalProviders: providerCount || 0,
                totalClients: clientCount || 0,
                totalVideos: videoCount || 0,
                totalBookings: bookingCount || 0,
                totalViews
            });
        } catch (error) {
            console.error('Error loading stats:', error);
            toast.error('Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

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

    const loadBookings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    client:profiles!bookings_client_id_fkey (full_name, avatar_url),
                    provider:profiles!bookings_provider_id_fkey (full_name, avatar_url),
                    category:skill_categories (name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error('Error loading bookings:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const loadModerationData = async () => {
        setLoading(true);
        try {
            const [
                { data: commentsData, error: commError },
                { data: reviewsData, error: revError }
            ] = await Promise.all([
                supabase.from('video_comments').select(`
                    *,
                    user:profiles (full_name, avatar_url),
                    video:skill_videos (title)
                `).order('created_at', { ascending: false }).limit(20),
                supabase.from('ratings').select(`
                    *,
                    client:profiles!ratings_client_id_fkey (full_name, avatar_url),
                    provider:profiles!ratings_provider_id_fkey (full_name, avatar_url)
                `).order('created_at', { ascending: false }).limit(20)
            ]);

            if (commError) throw commError;
            if (revError) throw revError;

            setComments(commentsData || []);
            setReviews(reviewsData || []);
        } catch (error) {
            console.error('Error loading moderation data:', error);
            toast.error('Failed to load moderation data');
        } finally {
            setLoading(false);
        }
    };

    const deleteComment = async (id: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        try {
            const { error } = await supabase.from('video_comments').delete().eq('id', id);
            if (error) throw error;
            setComments(prev => prev.filter(c => c.id !== id));
            toast.success('Comment deleted');
        } catch (error) {
            toast.error('Failed to delete comment');
        }
    };

    const deleteReview = async (id: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            const { error } = await supabase.from('ratings').delete().eq('id', id);
            if (error) throw error;
            setReviews(prev => prev.filter(r => r.id !== id));
            toast.success('Review deleted');
        } catch (error) {
            toast.error('Failed to delete review');
        }
    };

    const loadClients = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_type', 'client')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error loading clients:', error);
            toast.error('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('skill_categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const addCategory = async () => {
        if (!newCategory.name) return;
        try {
            const { data, error } = await supabase
                .from('skill_categories')
                .insert([newCategory])
                .select();

            if (error) throw error;
            if (data) {
                setCategories(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
            }
            setIsAddingCategory(false);
            setNewCategory({ name: '', icon: 'Tool' });
            toast.success('Category added successfully');
        } catch (error) {
            toast.error('Failed to add category');
        }
    };

    const deleteCategory = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This may affect videos in this category.`)) return;
        try {
            const { error } = await supabase.from('skill_categories').delete().eq('id', id);
            if (error) throw error;
            setCategories(prev => prev.filter(c => c.id !== id));
            toast.success('Category deleted');
        } catch (error) {
            toast.error('Failed to delete category');
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

    const filteredBookings = bookings.filter(b => {
        const matchesSearch =
            (b.client?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.provider?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (bookingFilter === 'all') return matchesSearch;
        return matchesSearch && b.status === bookingFilter;
    });

    return (
        <div className="min-h-screen bg-primary font-balthazar pt-20 pb-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-95 text-secondary-black md:hidden"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-secondary-black flex items-center gap-3">
                                Admin Control Panel
                                <span className="text-sm font-normal bg-secondary-cyan/10 text-secondary-cyan px-3 py-1 rounded-full border border-secondary-cyan/20">
                                    {activeTab === 'overview' ? 'Overview' :
                                        activeTab === 'providers' ? 'Verification Hub' :
                                            activeTab === 'clients' ? 'Client Database' :
                                                activeTab === 'videos' ? 'Video Moderation' :
                                                    activeTab === 'bookings' ? 'Booking Management' :
                                                        activeTab === 'categories' ? 'Service Categories' :
                                                            'Interaction Moderation'}
                                </span>
                            </h1>
                            <p className="text-secondary-black/60 mt-1">
                                {activeTab === 'overview'
                                    ? 'A high-level view of your platform performance.'
                                    : activeTab === 'providers'
                                        ? 'Manage and verify service providers on the platform.'
                                        : activeTab === 'videos'
                                            ? 'Review and approve uploaded skill videos.'
                                            : 'Track and manage bookings between clients and providers.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (activeTab === 'overview') loadStats();
                            else if (activeTab === 'providers') loadProviders();
                            else if (activeTab === 'clients') loadClients();
                            else if (activeTab === 'videos') loadVideos();
                            else if (activeTab === 'bookings') loadBookings();
                            else if (activeTab === 'moderation') loadModerationData();
                            else if (activeTab === 'categories') loadCategories();
                        }}
                        className="flex items-center gap-2 bg-secondary-black text-white px-4 py-2 rounded-lg hover:bg-secondary-black/80 transition-all font-bold"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'overview'
                            ? 'bg-secondary-black text-white shadow-lg'
                            : 'bg-white text-secondary-black hover:bg-secondary-black/5'
                            }`}
                    >
                        <BarChart3 className="w-5 h-5" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('providers')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'providers'
                            ? 'bg-secondary-black text-white shadow-lg'
                            : 'bg-white text-secondary-black hover:bg-secondary-black/5'
                            }`}
                    >
                        <Shield className="w-5 h-5" />
                        Providers
                    </button>
                    <button
                        onClick={() => setActiveTab('clients')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'clients'
                            ? 'bg-secondary-black text-white shadow-lg'
                            : 'bg-white text-secondary-black hover:bg-secondary-black/5'
                            }`}
                    >
                        <UserIcon className="w-5 h-5" />
                        Clients
                    </button>
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'videos'
                            ? 'bg-secondary-black text-white shadow-lg'
                            : 'bg-white text-secondary-black hover:bg-secondary-black/5'
                            }`}
                    >
                        <Video className="w-5 h-5" />
                        Videos
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'bookings'
                            ? 'bg-secondary-black text-white shadow-lg'
                            : 'bg-white text-secondary-black hover:bg-secondary-black/5'
                            }`}
                    >
                        <Calendar className="w-5 h-5" />
                        Bookings
                    </button>
                    <button
                        onClick={() => setActiveTab('moderation')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'moderation'
                            ? 'bg-secondary-black text-white shadow-lg'
                            : 'bg-white text-secondary-black hover:bg-secondary-black/5'
                            }`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        Moderation
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'categories'
                            ? 'bg-secondary-black text-white shadow-lg'
                            : 'bg-white text-secondary-black hover:bg-secondary-black/5'
                            }`}
                    >
                        <Layout className="w-5 h-5" />
                        Categories
                    </button>
                </div>

                {/* Filters & Search */}
                {activeTab !== 'overview' && activeTab !== 'moderation' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-secondary-black/5 p-4 mb-6 flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-black/30" />
                            <input
                                type="text"
                                placeholder={
                                    activeTab === 'providers' ? "Search by name or email..." :
                                        activeTab === 'videos' ? "Search by title or provider..." :
                                            "Search by client, provider or category..."
                                }
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-secondary-black/10 focus:outline-none focus:ring-2 focus:ring-secondary-orange/20 focus:border-secondary-orange transition-all"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
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
                            ) : activeTab === 'videos' ? (
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
                            ) : (
                                (['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setBookingFilter(f)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${bookingFilter === f
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
                )}

                {/* Main Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-secondary-cyan animate-spin mb-4" />
                        <p className="text-secondary-black/40 font-bold animate-pulse">Syncing Data...</p>
                    </div>
                ) : activeTab === 'overview' ? (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Providers', value: stats.totalProviders, icon: Users, color: 'bg-blue-500', trend: '+12% this month' },
                                { label: 'Clients', value: stats.totalClients, icon: UserIcon, color: 'bg-purple-500', trend: '+5% this month' },
                                { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'bg-secondary-orange', trend: '+18% this month' },
                                { label: 'Video Views', value: stats.totalViews, icon: Eye, color: 'bg-secondary-cyan', trend: '+25% this month' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-black/5 relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color} opacity-5 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-110`} />
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-xl ${stat.color} text-white shadow-lg`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div className="text-2xl font-bold text-secondary-black">{stat.value.toLocaleString()}</div>
                                    </div>
                                    <div className="text-secondary-black/40 text-sm font-bold mb-2 uppercase tracking-tight">{stat.label}</div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                        <TrendingUp className="w-3 h-3" />
                                        {stat.trend}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity Mockup / Placeholder for more complex analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-secondary-black/5 p-6">
                                <h3 className="text-lg font-bold text-secondary-black mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-secondary-orange" />
                                    Growth Trends
                                </h3>
                                <div className="h-64 flex items-end justify-between gap-2 px-4">
                                    {[40, 65, 45, 90, 70, 85, 100, 80, 95, 75, 85, 110].map((h, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div
                                                className="w-full bg-secondary-cyan/20 rounded-t-lg transition-all group-hover:bg-secondary-cyan group-hover:shadow-lg group-hover:shadow-secondary-cyan/20 cursor-pointer"
                                                style={{ height: `${h}%` }}
                                            />
                                            <span className="text-[10px] text-secondary-black/30 font-bold uppercase">M{i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-secondary-black/5 p-6">
                                <h3 className="text-lg font-bold text-secondary-black mb-6 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-secondary-orange" />
                                    Activity pulse
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { user: 'Sarah J.', action: 'Booked a plumber', time: '2m ago' },
                                        { user: 'Mike R.', action: 'Uploaded new video', time: '15m ago' },
                                        { user: 'Emma D.', action: 'Left a 5★ review', time: '1h ago' },
                                        { user: 'Alex K.', action: 'Joined as Provider', time: '3h ago' },
                                        { user: 'John M.', action: 'Verified account', time: '5h ago' },
                                    ].map((act, i) => (
                                        <div key={i} className="flex items-center gap-3 py-2 border-b border-secondary-black/5 last:border-0">
                                            <div className="w-8 h-8 rounded-full bg-secondary-black/5 flex items-center justify-center text-xs font-bold text-secondary-black">
                                                {act.user.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs font-bold"><span className="text-secondary-cyan">{act.user}</span> {act.action}</div>
                                                <div className="text-[10px] text-secondary-black/30">{act.time}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
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
                ) : activeTab === 'clients' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-secondary-black/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary-black/5">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider">Client</th>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider">Contact & Location</th>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider text-center">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-black/5">
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-secondary-cyan/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-secondary-black/10 flex items-center justify-center text-secondary-black/40 font-bold overflow-hidden shadow-sm">
                                                        {client.avatar_url ? (
                                                            <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            client.full_name?.charAt(0) || <UserIcon className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div className="font-bold text-secondary-black">{client.full_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="text-secondary-black font-medium">{client.email}</div>
                                                <div className="text-secondary-black/40 text-xs">{client.location || 'No location set'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="text-secondary-black/60 text-xs">{new Date(client.created_at).toLocaleDateString()}</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredClients.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-20 text-center">
                                                <Users className="w-12 h-12 mx-auto mb-2 opacity-10" />
                                                <p className="font-bold opacity-30">No clients found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'videos' ? (
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
                ) : activeTab === 'bookings' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-secondary-black/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary-black/5">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider">Client</th>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider">Provider</th>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider">Service</th>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider">Schedule</th>
                                        <th className="px-6 py-4 font-bold text-secondary-black uppercase text-xs tracking-wider text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-black/5">
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-secondary-cyan/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-secondary-black/10 flex items-center justify-center overflow-hidden">
                                                        {booking.client?.avatar_url ? (
                                                            <img src={booking.client.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserIcon className="w-4 h-4 text-secondary-black/40" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-bold text-secondary-black">{booking.client?.full_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-secondary-black/10 flex items-center justify-center overflow-hidden">
                                                        {booking.provider?.avatar_url ? (
                                                            <img src={booking.provider.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserIcon className="w-4 h-4 text-secondary-black/40" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-bold text-secondary-black">{booking.provider?.full_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-secondary-black">{booking.category?.name}</div>
                                                <div className="text-[10px] text-secondary-black/40 uppercase font-bold tracking-tight">{booking.location}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-medium text-secondary-black">{new Date(booking.preferred_date).toLocaleDateString()}</div>
                                                <div className="text-secondary-black/40 text-xs">{booking.preferred_time}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredBookings.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-10" />
                                                <p className="font-bold opacity-30">No bookings found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'categories' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-secondary-black">Service Categories</h3>
                            <button
                                onClick={() => setIsAddingCategory(true)}
                                className="bg-secondary-black text-white px-6 py-2 rounded-xl font-bold hover:bg-secondary-black/80 transition-all flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add New Category
                            </button>
                        </div>

                        {isAddingCategory && (
                            <div className="bg-white p-6 rounded-2xl border border-secondary-cyan/20 shadow-lg animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-secondary-black/40 uppercase tracking-widest pl-1">Category Name</label>
                                        <input
                                            type="text"
                                            value={newCategory.name}
                                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                            placeholder="e.g. Electrician, Makeup Artist"
                                            className="w-full px-4 py-3 rounded-xl border border-secondary-black/10 focus:ring-2 focus:ring-secondary-cyan/20 focus:border-secondary-cyan transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-secondary-black/40 uppercase tracking-widest pl-1">Lucide Icon Name</label>
                                        <input
                                            type="text"
                                            value={newCategory.icon}
                                            onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                                            placeholder="e.g. Tool, Music, Heart"
                                            className="w-full px-4 py-3 rounded-xl border border-secondary-black/10 focus:ring-2 focus:ring-secondary-cyan/20 focus:border-secondary-cyan transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsAddingCategory(false)}
                                        className="px-6 py-2 rounded-xl font-bold text-secondary-black/60 hover:bg-secondary-black/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={addCategory}
                                        disabled={!newCategory.name}
                                        className="bg-secondary-cyan text-white px-8 py-2 rounded-xl font-bold hover:bg-secondary-cyan/80 transition-all disabled:opacity-50"
                                    >
                                        Save Category
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {categories.map((cat) => (
                                <div key={cat.id} className="bg-white p-6 rounded-2xl border border-secondary-black/5 hover:border-secondary-cyan/30 hover:shadow-md transition-all group relative overflow-hidden text-center">
                                    <div className="w-12 h-12 bg-secondary-cyan/10 rounded-2xl flex items-center justify-center text-secondary-cyan mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <Layout className="w-6 h-6" />
                                    </div>
                                    <div className="font-bold text-secondary-black mb-1">{cat.name}</div>
                                    <div className="text-[10px] text-secondary-black/30 font-bold uppercase tracking-widest">{cat.icon}</div>

                                    <button
                                        onClick={() => deleteCategory(cat.id, cat.name)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : activeTab === 'moderation' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Comments Moderation */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-secondary-black flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-secondary-orange" />
                                Recent Comments
                            </h3>
                            <div className="bg-white rounded-2xl shadow-sm border border-secondary-black/5 divide-y divide-secondary-black/5">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="p-4 hover:bg-secondary-cyan/5 transition-colors group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-secondary-black/10 overflow-hidden">
                                                    {comment.user?.avatar_url && <img src={comment.user.avatar_url} className="w-full h-full object-cover" />}
                                                </div>
                                                <span className="text-xs font-bold text-secondary-cyan">{comment.user?.full_name}</span>
                                                <span className="text-[10px] text-secondary-black/30 font-bold uppercase">on "{comment.video?.title}"</span>
                                            </div>
                                            <button
                                                onClick={() => deleteComment(comment.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                                                title="Delete Comment"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-secondary-black/70 pl-8">{comment.content}</p>
                                        <div className="text-[10px] text-secondary-black/30 pl-8 mt-1 italic">{new Date(comment.created_at).toLocaleString()}</div>
                                    </div>
                                ))}
                                {comments.length === 0 && (
                                    <div className="p-12 text-center opacity-30 font-bold">No comments to moderate</div>
                                )}
                            </div>
                        </div>

                        {/* Reviews Moderation */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-secondary-black flex items-center gap-2">
                                <Star className="w-5 h-5 text-secondary-orange" />
                                Recent Reviews
                            </h3>
                            <div className="bg-white rounded-2xl shadow-sm border border-secondary-black/5 divide-y divide-secondary-black/5">
                                {reviews.map((review) => (
                                    <div key={review.id} className="p-4 hover:bg-secondary-cyan/5 transition-colors group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center -space-x-2">
                                                    <div className="w-6 h-6 rounded-full border-2 border-white bg-secondary-black/10 overflow-hidden shadow-sm">
                                                        {review.client?.avatar_url && <img src={review.client.avatar_url} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div className="w-6 h-6 rounded-full border-2 border-white bg-secondary-black/10 overflow-hidden shadow-sm">
                                                        {review.provider?.avatar_url && <img src={review.provider.avatar_url} className="w-full h-full object-cover" />}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-secondary-cyan">{review.client?.full_name} → {review.provider?.full_name}</span>
                                            </div>
                                            <button
                                                onClick={() => deleteReview(review.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                                                title="Delete Review"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1 mb-2 pl-10">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-secondary-orange text-secondary-orange' : 'text-secondary-black/10'}`} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-secondary-black/70 pl-10 italic">"{review.review || 'No written review'}"</p>
                                        <div className="text-[10px] text-secondary-black/30 pl-10 mt-1">{new Date(review.created_at).toLocaleString()}</div>
                                    </div>
                                ))}
                                {reviews.length === 0 && (
                                    <div className="p-12 text-center opacity-30 font-bold">No reviews to moderate</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-secondary-black/10">
                        <Shield className="w-12 h-12 text-secondary-black/10 mb-4" />
                        <p className="text-secondary-black/40 font-bold">Select a tab to manage platform data</p>
                    </div>
                )}
            </div>
        </div>
    );
}
