import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageCircle, Trash2, BadgeCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

// @ts-ignore
type Comment = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        full_name: string;
        avatar_url: string | null;
        is_verified: boolean;
    };
};

interface VideoCommentsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    videoId: string;
}

export function VideoCommentsSheet({ isOpen, onClose, videoId }: VideoCommentsSheetProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && videoId) {
            loadComments();
        }
    }, [isOpen, videoId]);

    const loadComments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                // @ts-ignore
                .from('video_comments')
                .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (
            full_name,
            avatar_url,
            is_verified
          )
        `)
                .eq('video_id', videoId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setComments((data as any) || []);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim() || submitting) return;

        try {
            setSubmitting(true);
            const { data, error } = await supabase
                // @ts-ignore
                .from('video_comments')
                .insert({
                    video_id: videoId,
                    user_id: user.id,
                    content: newComment.trim()
                })
                .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (
            full_name,
            avatar_url,
            is_verified
          )
        `)
                .single();

            if (error) throw error;

            setComments(prev => [...prev, data as any]);
            setNewComment('');

            // Auto scroll to bottom
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                // @ts-ignore
                .from('video_comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', user.id);

            if (error) throw error;
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="relative w-full max-w-lg bg-white sm:rounded-3xl h-[80vh] sm:h-[600px] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                {/* Handle for mobile */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 sm:hidden" />

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-secondary-cyan" />
                        <h2 className="text-lg font-bold text-gray-900">
                            Comments <span className="text-gray-400 font-medium ml-1">({comments.length})</span>
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Comments List */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar"
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p className="text-sm font-medium">Loading conversation...</p>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-10">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <MessageCircle className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">No comments yet</h3>
                            <p className="text-sm text-gray-500">Be the first to ask a question or show some love!</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="group flex gap-4">
                                <div className="flex-shrink-0">
                                    {comment.profiles.avatar_url ? (
                                        <img
                                            src={comment.profiles.avatar_url}
                                            className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-secondary-cyan/10 flex items-center justify-center text-secondary-cyan font-bold">
                                            {comment.profiles.full_name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="font-bold text-sm text-gray-900 truncate">
                                            {comment.profiles.full_name}
                                        </span>
                                        {comment.profiles.is_verified && (
                                            <BadgeCheck className="w-3.5 h-3.5 text-secondary-cyan fill-white" />
                                        )}
                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                            • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed break-words">
                                        {comment.content}
                                    </p>
                                </div>
                                {user?.id === comment.user_id && (
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Input Footer */}
                <div className="p-4 sm:p-6 bg-gray-50/50 border-t border-gray-100">
                    {user ? (
                        <form onSubmit={handleSubmit} className="flex items-center gap-3">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-white px-5 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-cyan/50 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || submitting}
                                className="p-3 bg-secondary-black text-white rounded-2xl disabled:opacity-50 disabled:grayscale transition-all active:scale-95 shadow-lg shadow-black/10"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </form>
                    ) : (
                        <p className="text-sm text-center text-gray-500 font-medium py-2">
                            Please sign in to join the conversation.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
