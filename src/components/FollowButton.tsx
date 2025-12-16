import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FollowButtonProps {
    providerId: string;
    initialFollowersCount?: number;
    onFollowChange?: (isFollowing: boolean, newCount: number) => void;
    className?: string;
    onAuthRequired?: () => void;
}

export function FollowButton({
    providerId,
    initialFollowersCount = 0,
    onFollowChange,
    className = '',
    onAuthRequired
}: FollowButtonProps) {
    const { user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(initialFollowersCount);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (user) {
            checkFollowStatus();
        } else {
            setChecking(false);
        }
    }, [user, providerId]);

    const checkFollowStatus = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('followers')
                .select('id')
                .eq('follower_id', user.id)
                .eq('following_id', providerId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error checking follow status:', error);
            }

            setIsFollowing(!!data);
        } catch (error) {
            console.error('Error checking follow status:', error);
        } finally {
            setChecking(false);
        }
    };

    const handleFollow = async () => {
        if (!user) {
            if (onAuthRequired) {
                onAuthRequired();
            } else {
                alert('Please sign in to follow providers');
            }
            return;
        }

        if (user.id === providerId) {
            alert('You cannot follow yourself');
            return;
        }

        // Optimistic Update
        const previousIsFollowing = isFollowing;
        const previousCount = followersCount;

        const newIsFollowing = !isFollowing;
        const newCount = newIsFollowing ? followersCount + 1 : Math.max(0, followersCount - 1);

        setIsFollowing(newIsFollowing);
        setFollowersCount(newCount);
        onFollowChange?.(newIsFollowing, newCount);

        setLoading(true);

        try {
            if (previousIsFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('followers')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', providerId);

                if (error) throw error;



            } else {
                // Follow
                const { error } = await supabase
                    .from('followers')
                    .insert({
                        follower_id: user.id,
                        following_id: providerId,
                    } as any);

                if (error) throw error;


            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            // Revert optimistic update
            setIsFollowing(previousIsFollowing);
            setFollowersCount(previousCount);
            onFollowChange?.(previousIsFollowing, previousCount);
            alert(`Failed to update follow status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <button
                disabled
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed flex items-center gap-2"
            >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Loading...</span>
            </button>
        );
    }

    if (!user || user.id === providerId) {
        return (
            <button
                onClick={handleFollow}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg ${className}`}
            >
                <UserPlus className="w-4 h-4" />
                <span className="text-sm">Follow</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${isFollowing
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <UserMinus className="w-4 h-4" />
            ) : (
                <UserPlus className="w-4 h-4" />
            )}
            <span className="text-sm">
                {isFollowing ? 'Following' : 'Follow'}
            </span>
        </button>
    );
}
