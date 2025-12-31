import { Users, Eye, MapPin, TrendingUp, Star, Briefcase, Video, CheckCircle, ShieldCheck } from 'lucide-react';

interface ProviderStatsHeaderProps {
    profile: {
        avatar_url: string | null;
        full_name: string;
        location: string | null;
        experience: string | null;
        specialty: string | null;
        bio: string | null;
        followers_count: number;
        is_verified?: boolean;
    } | null;
    stats: {
        totalVideos: number;
        totalViews: number;
        averageRating: number;
        totalReviews: number;
    };
}

export function ProviderStatsHeader({ profile, stats }: ProviderStatsHeaderProps) {
    if (!profile) return null;

    return (
        <div className="bg-gradient-to-br from-secondary-black via-[#1E293B] to-secondary-black rounded-[2.5rem] p-8 md:p-10 mb-8 text-white shadow-2xl border border-white/5 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-cyan/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full -ml-24 -mb-24 blur-3xl" />

            <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Avatar Section */}
                <div className="relative group shrink-0">
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden ring-4 ring-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.full_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                                <span className="text-4xl md:text-5xl font-black text-white/40">
                                    {profile.full_name?.charAt(0) || 'P'}
                                </span>
                            </div>
                        )}
                    </div>
                    {profile.is_verified && (
                        <div className="absolute -bottom-3 -right-3 bg-white p-1.5 rounded-xl shadow-xl">
                            <CheckCircle className="w-6 h-6 text-secondary-cyan" />
                        </div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight">{profile.full_name || 'Provider'}</h1>
                        {profile.is_verified && (
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] text-secondary-cyan bg-secondary-cyan/10 px-3 py-1 rounded-full border border-secondary-cyan/20 w-fit mx-auto md:mx-0">
                                <ShieldCheck className="w-3 h-3" />
                                VERIFIED PROVIDER
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-gray-400 text-sm font-bold mb-6">
                        {profile.location && (
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                <MapPin className="w-4 h-4 text-secondary-cyan" />
                                <span>{profile.location}</span>
                            </div>
                        )}
                        {profile.experience && (
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                <Briefcase className="w-4 h-4 text-secondary-cyan" />
                                <span>{profile.experience}</span>
                            </div>
                        )}
                        {profile.specialty && (
                            <div className="flex items-center gap-1.5 bg-secondary-cyan/10 text-secondary-cyan px-3 py-1.5 rounded-xl border border-secondary-cyan/20">
                                <Star className="w-4 h-4 fill-secondary-cyan" />
                                <span>{profile.specialty}</span>
                            </div>
                        )}
                    </div>

                    {profile.bio && (
                        <p className="text-gray-400 leading-relaxed max-w-2xl text-base font-medium italic">
                            "{profile.bio}"
                        </p>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 mt-10 pt-10 border-t border-white/5">
                {[
                    { label: 'Followers', value: profile.followers_count || 0, icon: Users, color: 'text-blue-400' },
                    { label: 'Videos', value: stats.totalVideos, icon: Video, color: 'text-purple-400' },
                    { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-emerald-400' },
                    { label: 'Rating', value: stats.averageRating.toFixed(1), icon: Star, color: 'text-amber-400', isStar: true },
                    { label: 'Reviews', value: stats.totalReviews, icon: TrendingUp, color: 'text-rose-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-all group">
                        <div className="flex items-center gap-3 mb-2">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">{stat.label}</span>
                        </div>
                        <div className="text-2xl font-black tracking-tight">{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
