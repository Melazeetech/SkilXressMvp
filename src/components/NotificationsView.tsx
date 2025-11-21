import { useState, useEffect } from 'react';
import { Bell, Heart, UserPlus, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type NotificationItem = {
    id: string;
    type: 'like' | 'follow' | 'booking';
    title: string;
    message: string;
    created_at: string;
    read: boolean;
    data?: any;
};

export function NotificationsView() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingRead, setMarkingRead] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadNotifications();
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;
        setLoading(true);
        const allNotifications: NotificationItem[] = [];

        try {
            // Fetch user profile for last_read_at
            const { data: profile } = await supabase
                .from('profiles')
                .select('last_read_notifications_at')
                .eq('id', user.id)
                .single();

            const lastReadAt = (profile as any)?.last_read_notifications_at ? new Date((profile as any).last_read_notifications_at) : new Date(0);

            // 1. Fetch Likes (on my videos)
            const { data: myVideos } = await supabase
                .from('skill_videos')
                .select('id, title')
                .eq('provider_id', user.id);

            if (myVideos && myVideos.length > 0) {
                const videoIds = (myVideos as any[]).map(v => v.id);
                const { data: likes } = await supabase
                    .from('video_likes')
                    .select(`
            id,
            created_at,
            user:profiles!video_likes_user_id_fkey(full_name),
            video:skill_videos!video_likes_video_id_fkey(title)
          `)
                    .in('video_id', videoIds)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (likes) {
                    (likes as any[]).forEach((like) => {
                        allNotifications.push({
                            id: like.id,
                            type: 'like',
                            title: 'New Like',
                            message: `${like.user?.full_name || 'Someone'} liked your video "${like.video?.title}"`,
                            created_at: like.created_at,
                            read: new Date(like.created_at) <= lastReadAt,
                            data: like
                        });
                    });
                }
            }

            // 2. Fetch New Followers
            const { data: followers } = await supabase
                .from('followers')
                .select(`
          id,
          created_at,
          follower:profiles!followers_follower_id_fkey(full_name)
        `)
                .eq('following_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (followers) {
                (followers as any[]).forEach((follow) => {
                    allNotifications.push({
                        id: follow.id,
                        type: 'follow',
                        title: 'New Follower',
                        message: `${follow.follower?.full_name || 'Someone'} started following you`,
                        created_at: follow.created_at,
                        read: new Date(follow.created_at) <= lastReadAt,
                        data: follow
                    });
                });
            }

            // 3. Fetch Bookings (as client or provider)
            const { data: bookings } = await supabase
                .from('bookings')
                .select(`
          id,
          status,
          created_at,
          preferred_date,
          client:profiles!bookings_client_id_fkey(full_name),
          provider:profiles!bookings_provider_id_fkey(full_name)
        `)
                .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
                .order('created_at', { ascending: false })
                .limit(20);

            if (bookings) {
                (bookings as any[]).forEach((booking) => {
                    const otherName = booking.client_id === user.id ? booking.provider?.full_name : booking.client?.full_name;

                    allNotifications.push({
                        id: booking.id,
                        type: 'booking',
                        title: 'Booking Update',
                        message: `Booking with ${otherName} is ${booking.status}`,
                        created_at: booking.created_at,
                        read: new Date(booking.created_at) <= lastReadAt,
                        data: booking
                    });
                });
            }

            // Sort all by date
            allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setNotifications(allNotifications);

        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        setMarkingRead(true);
        try {
            const now = new Date().toISOString();
            await supabase
                .from('profiles')
                .update({ last_read_notifications_at: now } as any)
                .eq('id', user.id);

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        } finally {
            setMarkingRead(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-white min-h-[calc(100vh-3.5rem)]">
            <div className="p-4 border-b border-gray-100 sticky top-14 bg-white z-10 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        disabled={markingRead}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                        {markingRead ? 'Marking...' : 'Mark all as read'}
                    </button>
                )}
            </div>

            <div className="divide-y divide-gray-100">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors flex gap-4 ${!notification.read ? 'bg-blue-50/30' : ''}`}>
                            <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${notification.type === 'like' ? 'bg-red-100 text-red-600' :
                                notification.type === 'follow' ? 'bg-blue-100 text-blue-600' :
                                    'bg-green-100 text-green-600'
                                }`}>
                                {notification.type === 'like' && <Heart className="w-5 h-5 fill-current" />}
                                {notification.type === 'follow' && <UserPlus className="w-5 h-5" />}
                                {notification.type === 'booking' && <Calendar className="w-5 h-5" />}
                            </div>

                            <div className="flex-1">
                                <h3 className={`font-semibold text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>{notification.title}</h3>
                                <p className="text-gray-600 text-sm mt-0.5">{notification.message}</p>
                                <span className="text-xs text-gray-400 mt-2 block">
                                    {new Date(notification.created_at).toLocaleDateString()} • {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
