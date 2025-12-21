import { useState, useEffect } from 'react';
import { Bell, Heart, UserPlus, Calendar, Loader2, Trash2, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

type NotificationItem = {
    id: string;
    type: 'like' | 'follow' | 'booking' | 'message';
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
            setupRealtimeSubscription();
        }

        return () => {
            supabase.removeAllChannels();
        };
    }, [user]);

    const setupRealtimeSubscription = () => {
        if (!user) return;

        supabase
            .channel('notifications-table')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotification = payload.new as NotificationItem;
                    setNotifications(prev => [newNotification, ...prev]);
                    toast.success(newNotification.message, {
                        icon: getIconForType(newNotification.type),
                        duration: 4000
                    });
                }
            )
            .subscribe();
    };

    const loadNotifications = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (data) {
                setNotifications(data as NotificationItem[]);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Fallback for when table doesn't exist yet
            toast.error('Please run the database setup script first!');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));

            const { error } = await supabase
                .from('notifications')
                // @ts-ignore
                .update({ read: true })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking as read:', error);
            toast.error('Failed to update status');
        }
    };

    const markAllAsRead = async () => {
        if (!user || notifications.length === 0) return;
        setMarkingRead(true);

        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));

            const { error } = await supabase
                .from('notifications')
                // @ts-ignore
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);

            if (error) throw error;
            toast.success('All marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Failed to mark all as read');
            // Revert optimistic update
            loadNotifications();
        } finally {
            setMarkingRead(false);
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.id !== id));

            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Notification deleted');
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to delete');
            // Revert
            loadNotifications();
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'like': return '❤️';
            case 'follow': return '👤';
            case 'booking': return '📅';
            case 'message': return '💬';
            default: return '🔔';
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
            <div className="p-4 border-b border-gray-100 sticky top-14 bg-white z-10 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    {unreadCount > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                            {unreadCount} new
                        </span>
                    )}
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={markAllAsRead}
                        disabled={markingRead || unreadCount === 0}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark all read
                    </button>
                )}
            </div>

            <div className="divide-y divide-gray-100">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
                        <p className="text-sm">We'll notify you when something happens.</p>

                        {Notification.permission !== 'granted' && (
                            <div className="mt-8 p-6 bg-gradient-to-br from-secondary-black to-slate-900 rounded-2xl text-white shadow-xl max-w-sm w-full">
                                <Bell className="w-10 h-10 text-secondary-cyan mb-4 mx-auto" />
                                <h4 className="font-bold text-lg mb-2">Enable Push Alerts</h4>
                                <p className="text-xs text-blue-100/60 mb-6">
                                    Get notified about new bookings and messages even when the app is closed.
                                </p>
                                <button
                                    onClick={async () => {
                                        const granted = await (await import('../lib/notificationService')).notificationService.requestPermission();
                                        if (granted) {
                                            toast.success('Notifications enabled!');
                                            // Force a re-render
                                            setLoading(true);
                                            setTimeout(() => setLoading(false), 100);
                                        }
                                    }}
                                    className="w-full bg-secondary-cyan text-secondary-black font-bold py-2.5 rounded-xl hover:brightness-110 transition-all border-none"
                                >
                                    Enable Now
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                            className={`group p-4 hover:bg-gray-50 transition-all duration-200 flex gap-4 cursor-pointer relative ${!notification.read ? 'bg-blue-50/40 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                                }`}
                        >
                            <div className={`mt-1 p-2 rounded-full flex-shrink-0 shadow-sm ${notification.type === 'like' ? 'bg-red-100 text-red-600' :
                                notification.type === 'follow' ? 'bg-blue-100 text-blue-600' :
                                    notification.type === 'booking' ? 'bg-green-100 text-green-600' :
                                        'bg-purple-100 text-purple-600'
                                }`}>
                                {notification.type === 'like' && <Heart className="w-5 h-5 fill-current" />}
                                {notification.type === 'follow' && <UserPlus className="w-5 h-5" />}
                                {notification.type === 'booking' && <Calendar className="w-5 h-5" />}
                                {notification.type === 'message' && <MessageSquare className="w-5 h-5" />}
                            </div>

                            <div className="flex-1 pr-8">
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-semibold text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {notification.title}
                                    </h3>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                        {new Date(notification.created_at).toLocaleDateString() === new Date().toLocaleDateString()
                                            ? new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : new Date(notification.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className={`text-sm mt-0.5 ${!notification.read ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                                    {notification.message}
                                </p>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm">
                                {!notification.read && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                                        title="Mark as read"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => deleteNotification(notification.id, e)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                                    title="Delete notification"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
