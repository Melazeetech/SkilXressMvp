import { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileCompletionMeterProps {
    profile: any;
    stats: {
        totalVideos: number;
    };
    onStepClick?: (key: string) => void;
}

export function ProfileCompletionMeter({ profile, stats, onStepClick }: ProfileCompletionMeterProps) {
    const [portfolioCount, setPortfolioCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.id) {
            loadPortfolioCount();
        }
    }, [profile?.id]);

    const loadPortfolioCount = async () => {
        try {
            const { count, error } = await supabase
                .from('work_samples')
                .select('*', { count: 'exact', head: true })
                .eq('provider_id', profile.id);

            if (error) throw error;
            setPortfolioCount(count || 0);
        } catch (error) {
            console.error('Error loading portfolio count:', error);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { label: 'Add a professional avatar', key: 'avatar_url', weight: 15, completed: !!profile?.avatar_url },
        { label: 'Write a compelling bio', key: 'bio', weight: 20, completed: !!profile?.bio },
        { label: 'Set your primary specialty', key: 'specialty', weight: 15, completed: !!profile?.specialty },
        { label: 'Add your service location', key: 'location', weight: 10, completed: !!profile?.location },
        { label: 'Describe your experience', key: 'experience', weight: 10, completed: !!profile?.experience },
        { label: 'Upload your first skill video', key: 'videos', weight: 15, completed: stats.totalVideos > 0 },
        { label: 'Add at least one portfolio item', key: 'portfolio', weight: 15, completed: portfolioCount > 0 },
    ];

    const totalProgress = steps.reduce((acc, step) => acc + (step.completed ? step.weight : 0), 0);
    const nextStep = steps.find(s => !s.completed);

    if (totalProgress === 100) return null;

    if (loading) return null;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary-cyan/10 rounded-xl">
                        <Target className="w-5 h-5 text-secondary-cyan" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Profile Completion</h3>
                        <p className="text-xs text-gray-500">Reach 100% to boost your visibility in search</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-secondary-cyan">{totalProgress}%</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-6">
                <div
                    className="h-full bg-gradient-to-r from-secondary-cyan to-blue-500 transition-all duration-1000 ease-out"
                    style={{ width: `${totalProgress}%` }}
                />
            </div>

            {/* Steps List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {steps.map((step, idx) => (
                    <button
                        key={idx}
                        onClick={() => onStepClick?.(step.key)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${step.completed
                            ? 'bg-gray-50 border-transparent opacity-60'
                            : 'bg-white border-gray-100 shadow-sm hover:border-secondary-cyan/30 hover:shadow-md cursor-pointer'
                            }`}
                    >
                        {step.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                            <Circle className="w-5 h-5 text-gray-300 shrink-0 group-hover:text-secondary-cyan transition-colors" />
                        )}
                        <span className={`text-sm ${step.completed ? 'text-gray-500 line-through' : 'text-gray-700 font-medium group-hover:text-secondary-cyan transition-colors'}`}>
                            {step.label}
                        </span>
                        {!step.completed && (
                            <div className="ml-auto text-[10px] font-bold text-secondary-cyan bg-secondary-cyan/10 px-2 py-0.5 rounded-full group-hover:bg-secondary-cyan group-hover:text-white transition-all">
                                +{step.weight}%
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {nextStep && (
                <div
                    onClick={() => onStepClick?.(nextStep.key)}
                    className="mt-6 p-4 bg-secondary-black rounded-xl text-white flex items-center justify-between group cursor-pointer hover:bg-black transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <ArrowRight className="w-5 h-5 text-secondary-cyan transition-transform group-hover:translate-x-1" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-200">Next recommended action</p>
                            <p className="font-bold">{nextStep.label}</p>
                        </div>
                    </div>
                    <button className="text-sm font-bold bg-secondary-cyan text-secondary-black px-4 py-2 rounded-lg hover:brightness-110 transition-all">
                        Go Now
                    </button>
                </div>
            )}
        </div>
    );
}
