import { Calendar, Star, CheckCircle, MapPin, User as UserIcon } from 'lucide-react';

interface ClientStatsHeaderProps {
    profile: {
        avatar_url: string | null;
        full_name: string;
        location: string | null;
        bio: string | null;
    } | null;
    stats: {
        totalBookings: number;
        completedBookings: number;
        pendingBookings: number;
        totalReviews: number;
    };
}

export function ClientStatsHeader({ profile, stats }: ClientStatsHeaderProps) {
    if (!profile) return null;

    return (
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 md:p-8 mb-8 text-white shadow-lg">
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
                                {profile.full_name?.charAt(0) || 'C'}
                            </span>
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold mb-1">{profile.full_name || 'Client'}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-purple-100 text-sm mb-3">
                            {profile.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{profile.location}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                <span>Client Account</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bio */}
            {profile.bio && (
                <p className="mt-4 text-purple-50 leading-relaxed max-w-3xl">
                    {profile.bio}
                </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Calendar className="w-5 h-5 text-purple-200" />
                        <div className="text-2xl md:text-3xl font-bold">{stats.totalBookings}</div>
                    </div>
                    <div className="text-purple-200 text-xs md:text-sm">Total Bookings</div>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <CheckCircle className="w-5 h-5 text-green-300" />
                        <div className="text-2xl md:text-3xl font-bold">{stats.completedBookings}</div>
                    </div>
                    <div className="text-purple-200 text-xs md:text-sm">Completed</div>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Calendar className="w-5 h-5 text-yellow-300" />
                        <div className="text-2xl md:text-3xl font-bold">{stats.pendingBookings}</div>
                    </div>
                    <div className="text-purple-200 text-xs md:text-sm">Pending</div>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Star className="w-5 h-5 text-yellow-300" />
                        <div className="text-2xl md:text-3xl font-bold">{stats.totalReviews}</div>
                    </div>
                    <div className="text-purple-200 text-xs md:text-sm">Reviews Given</div>
                </div>
            </div>
        </div>
    );
}
