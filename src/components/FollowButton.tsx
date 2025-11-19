import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FollowButtonProps {
    providerId: string;
    initialFollowersCount?: number;
    onFollowChange?: (isFollowing: boolean, newCount: number) => void;
}

export function FollowButton({
    providerId,
    initialFollowersCount = 0,
    onFollowChange
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
            alert('Please sign in to follow providers');
            return;
        }

        if (user.id === providerId) {
            alert('You cannot follow yourself');
            return;
        }

        console.log('Attempting to follow:', {
            follower_id: user.id,
            following_id: providerId,
            user_object: user,
            user_email: user.email
        });

        setLoading(true);

        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('followers')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', providerId);

                if (error) throw error;

                setIsFollowing(false);
                const newCount = Math.max(0, followersCount - 1);
                setFollowersCount(newCount);
                onFollowChange?.(false, newCount);
            } else {
                // Follow
                const insertData = {
                    follower_id: user.id,
                    following_id: providerId,
                };

                console.log('Insert data:', insertData);

                const { data, error } = await supabase
                    .from('followers')
                    .insert([insertData])
                    .select();

                if (error) {
                    console.error('Follow error details:', {
                        error,
                        code: error.code,
                        message: error.message,
                        details: error.details,
                        hint: error.hint
                    });
                    throw error;
                }

                console.log('Follow success:', data);

                setIsFollowing(true);
                const newCount = followersCount + 1;
                setFollowersCount(newCount);
                onFollowChange?.(true, newCount);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
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
        return null;
    }

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${isFollowing
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
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
