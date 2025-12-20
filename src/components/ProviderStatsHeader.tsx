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
        <div className="bg-gradient-to-br from-secondary-black via-slate-900 to-secondary-black rounded-2xl p-6 md:p-8 mb-8 text-white shadow-xl border border-white/10">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-start gap-4">
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/20 object-cover shadow-lg"
                        />
                    ) : (
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 border-4 border-white/20 flex items-center justify-center shadow-lg">
                            <span className="text-3xl md:text-4xl font-bold text-white">
                                {profile.full_name?.charAt(0) || 'P'}
                            </span>
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl md:text-3xl font-bold">{profile.full_name || 'Provider'}</h1>
                            {profile.is_verified && (
                                <CheckCircle className="w-6 h-6 text-cyan-400 fill-cyan-400/20" />
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-blue-100 text-sm mb-3">
                            {profile.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{profile.location}</span>
                                </div>
                            )}
                            {profile.experience && (
                                <div className="flex items-center gap-1">
                                    <Briefcase className="w-4 h-4" />
                                    <span>{profile.experience}</span>
                                </div>
                            )}
                        </div>
                        {profile.specialty && (
                            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-3">
                                <Star className="w-3 h-3 inline mr-1" />
                                {profile.specialty}
                            </div>
                        )}
                        {profile.is_verified && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 bg-cyan-400/10 w-fit px-3 py-1 rounded-full border border-cyan-400/20 mt-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                VERIFIED PROVIDER
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bio */}
            {profile.bio && (
                <p className="mt-4 text-blue-50 leading-relaxed max-w-3xl">
                    {profile.bio}
                </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-white/20">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Users className="w-5 h-5 text-blue-200" />
                        <div className="text-2xl md:text-3xl font-bold">{profile.followers_count || 0}</div>
                    </div>
                    <div className="text-blue-200 text-xs md:text-sm">Followers</div>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Video className="w-5 h-5 text-blue-200" />
                        <div className="text-2xl md:text-3xl font-bold">{stats.totalVideos}</div>
                    </div>
                    <div className="text-blue-200 text-xs md:text-sm">Videos</div>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Eye className="w-5 h-5 text-blue-200" />
                        <div className="text-2xl md:text-3xl font-bold">{stats.totalViews.toLocaleString()}</div>
                    </div>
                    <div className="text-blue-200 text-xs md:text-sm">Total Views</div>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Star className="w-5 h-5 text-yellow-300" />
                        <div className="text-2xl md:text-3xl font-bold">{stats.averageRating.toFixed(1)}</div>
                    </div>
                    <div className="text-blue-200 text-xs md:text-sm">Rating</div>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <TrendingUp className="w-5 h-5 text-blue-200" />
                        <div className="text-2xl md:text-3xl font-bold">{stats.totalReviews}</div>
                    </div>
                    <div className="text-blue-200 text-xs md:text-sm">Reviews</div>
                </div>
            </div>
        </div>
    );
}
