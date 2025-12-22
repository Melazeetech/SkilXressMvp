import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, Video, Calendar, Star, ArrowRight, Wrench, Home as HomeIcon, Scissors, Car, Zap, Users, CheckCircle, Shield, Clock, DollarSign, MessageCircle, CreditCard, Smartphone, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';
import { useCarousel } from '../hooks/useCarousel';
import { InstallPWA } from './InstallPWA';
import { InfoModal } from './InfoModal';

interface LandingPageProps {
    onGetStarted: () => void;
    onBrowse: (categoryId?: string) => void;
    onShowPrivacy?: () => void;
}

interface Testimonial {
    id: string;
    name: string;
    role: string;
    rating: number;
    text: string;
    service: string;
    avatar: string;
}

interface Category {
    id: string;
    name: string;
    icon: any;
    color: string;
}

// Fallback data in case of empty DB or error
const fallbackTestimonials = [
    {
        id: '1',
        name: "Sarah Johnson",
        role: "Client",
        rating: 5,
        text: "Found an amazing plumber through SkilXpress! The video portfolio helped me choose the right professional. Highly recommend!",
        service: "Plumbing",
        avatar: "SJ"
    },
    {
        id: '2',
        name: "Michael Chen",
        role: "Provider",
        rating: 5,
        text: "As a photographer, SkilXpress has been a game-changer. I get more bookings by showcasing my work through videos!",
        service: "Photography",
        avatar: "MC"
    }
];

export function LandingPage({ onGetStarted, onBrowse, onShowPrivacy }: LandingPageProps) {
    const [stats, setStats] = useState({
        providers: 0,
        bookings: 0,
        categories: 0,
        avgRating: 4.8,
        totalReviews: 0
    });
    const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredProviders, setFeaturedProviders] = useState<any[]>([]);
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [infoModalTitle, setInfoModalTitle] = useState('');
    const [infoModalContent, setInfoModalContent] = useState<React.ReactNode>(null);

    const openInfoModal = (title: string, content: React.ReactNode) => {
        setInfoModalTitle(title);
        setInfoModalContent(content);
        setInfoModalOpen(true);
    };

    const contents = {
        about: (
            <>
                <p>SkilXpress is a revolutionary platform connecting clients directly with skilled professionals through the power of video.</p>
                <h3>Our Mission</h3>
                <p>We believe seeing is believing. Traditional reviews can be faked or misleading. By showcasing real skills through video, we bring transparency, trust, and talent to the forefront of the service industry.</p>
                <h3>For Providers</h3>
                <p>Showcase your craft, build your reputation, and grow your business without relying solely on written words.</p>
                <h3>For Clients</h3>
                <p>See exactly what you're paying for. Verify skills instantly and book with confidence.</p>
            </>
        ),
        terms: (
            <>
                <p>By using SkilXpress, you agree to our terms of service.</p>
                <h3>1. Account Usage</h3>
                <p>Users must maintain accurate account information and are responsible for all activities under their account.</p>
                <h3>2. Service Booking</h3>
                <p>Bookings are binding agreements between Client and Provider. SkilXpress facilitates these connections but is not a party to the service contract.</p>
                <h3>3. Content Policy</h3>
                <p>All video content must be authentic and represent actual work performed by the provider. Misleading content will result in immediate suspension.</p>
            </>
        ),
        privacy: (
            <>
                <p>Your privacy is paramount. SkilXpress is committed to protecting your personal data.</p>
                <h3>Data Collection</h3>
                <p>We collect only necessary information to facilitate bookings and improve your experience.</p>
                <h3>Data Usage</h3>
                <p>Your data is never sold to third parties. It is used solely for platform functionality and verified communications.</p>
            </>
        ),
        help: (
            <>
                <p>Need assistance? We're here to help.</p>
                <h3>Common Questions</h3>
                <ul>
                    <li><strong>How do I book?</strong> Find a video you like, tap 'Book Now', and select a time.</li>
                    <li><strong>Is it safe?</strong> All providers are vetted, and videos help verify authentic skills.</li>
                </ul>
                <p>Contact us at support@skilxpress.com for urgent inquiries.</p>
            </>
        ),
        community: (
            <>
                <h3>Join the Movement</h3>
                <p>SkilXpress is more than an app; it's a community of skilled artisans and appreciative clients.</p>
                <p>Follow us on social media to see community highlights, featured provider stories, and tips for getting the most out of your services.</p>
            </>
        ),
        safe: (
            <>
                <h3>Safe Booking Guarantee</h3>
                <p>We prioritize your safety and satisfaction.</p>
                <ul>
                    <li>Verified Identities</li>
                    <li>Secure Payments (Coming Soon)</li>
                    <li>Dispute Resolution Support</li>
                    <li>Authentic Video Verification</li>
                </ul>
            </>
        )
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Animated counters - initialized with 0, updated when stats load
    const providersCount = useCountUp(stats.providers);
    const bookingsCount = useCountUp(stats.bookings);
    const categoriesCount = useCountUp(stats.categories);

    // Testimonials carousel
    const { currentIndex, next, prev, goTo } = useCarousel(testimonials.length, 5000);

    useEffect(() => {
        fetchLandingData();
    }, []);

    const fetchLandingData = async () => {
        try {
            // 1. Fetch Stats
            const { count: providers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('user_type', 'provider');

            const { count: bookings } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed');

            const { count: catsCount } = await supabase
                .from('skill_categories')
                .select('*', { count: 'exact', head: true });

            const { data: ratings } = await supabase
                .from('ratings')
                .select('rating');

            const avgRating = (ratings as any[])?.length
                ? (ratings as any[]).reduce((acc, curr) => acc + curr.rating, 0) / (ratings as any[]).length
                : 4.8;

            setStats({
                providers: providers || 0,
                bookings: bookings || 0,
                categories: catsCount || 0,
                avgRating: Number(avgRating.toFixed(1)),
                totalReviews: ratings?.length || 0
            });

            // 2. Fetch Testimonials (Recent 5-star reviews)
            const { data: reviews } = await supabase
                .from('ratings')
                .select(`
                    id,
                    rating,
                    review,
                    created_at,
                    client_id,
                    bookings (
                        category_id
                    ),
                    profiles!ratings_client_id_fkey (
                        full_name
                    )
                `)
                .eq('rating', 5)
                .not('review', 'is', null)
                .order('created_at', { ascending: false })
                .limit(6);

            if (reviews && reviews.length > 0) {
                // Fetch category names for the bookings
                const reviewsData = reviews as any[];
                const categoryIds = [...new Set(reviewsData.map(r => r.bookings?.category_id).filter(Boolean))];
                const { data: cats } = await supabase
                    .from('skill_categories')
                    .select('id, name')
                    .in('id', categoryIds as string[]);

                const catMap = new Map((cats as any[])?.map(c => [c.id, c.name]));

                const formattedTestimonials: Testimonial[] = [];

                for (const r of reviewsData) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', r.client_id)
                        .single() as any;

                    formattedTestimonials.push({
                        id: r.id,
                        name: profile?.full_name || 'Anonymous',
                        role: 'Client',
                        rating: r.rating,
                        text: r.review || '',
                        service: catMap.get(r.bookings?.category_id) || 'Service',
                        avatar: (profile?.full_name || 'A').charAt(0).toUpperCase() + ((profile?.full_name || '').split(' ')[1] || '').charAt(0).toUpperCase()
                    });
                }
                setTestimonials(formattedTestimonials);
            }

            // 3. Fetch Categories
            const { data: fetchedCategories } = await supabase
                .from('skill_categories')
                .select('*')
                .limit(6);

            if (fetchedCategories) {
                // Map icons dynamically if possible, or use a default set
                const iconMap: Record<string, any> = {
                    'Plumbing': Wrench,
                    'Electrical': Zap,
                    'Cleaning': HomeIcon,
                    'Haircut': Scissors,
                    'Auto Repair': Car,
                    'Photography': Video,
                    // Add defaults/fallbacks
                };

                const colors = ['blue', 'yellow', 'green', 'purple', 'red', 'pink'];

                const formattedCategories = (fetchedCategories as any[]).map((c, idx) => ({
                    id: c.id,
                    name: c.name,
                    icon: iconMap[c.name] || Wrench, // Fallback icon
                    color: colors[idx % colors.length]
                }));
                setCategories(formattedCategories);
            }

            // 4. Fetch Featured Providers
            const { data: topProviders } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    avatar_url,
                    location,
                    user_type,
                    is_verified
                `)
                .eq('user_type', 'provider')
                .order('followers_count', { ascending: false })
                .limit(4);

            if (topProviders) {
                setFeaturedProviders(topProviders);
            }

        } catch (error) {
            console.error('Error fetching landing page data:', error);
        }
    };

    return (
        <div className="min-h-screen bg-primary font-balthazar">
            <InfoModal
                isOpen={infoModalOpen}
                onClose={() => setInfoModalOpen(false)}
                title={infoModalTitle}
                content={infoModalContent}
            />
            {/* Sticky Header */}
            <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled || menuOpen ? 'bg-white/95 backdrop-blur-lg shadow-sm py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 group-hover:scale-110 transition-transform">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-secondary-black tracking-tight leading-none">
                                SkilXpress
                            </span>
                        </div>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-bold text-secondary-black/70 hover:text-secondary-orange transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-bold text-secondary-black/70 hover:text-secondary-orange transition-colors">How it Works</a>
                        <InstallPWA />
                        <button
                            onClick={onGetStarted}
                            className="bg-secondary-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-secondary-orange transition-all shadow-lg active:scale-95"
                        >
                            Get Started
                        </button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 text-secondary-black"
                    >
                        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-6 shadow-xl animate-in slide-in-from-top-5">
                        <nav className="flex flex-col gap-6">
                            <a href="#features" onClick={() => setMenuOpen(false)} className="text-lg font-bold text-secondary-black/70 hover:text-secondary-orange flex items-center justify-between">
                                Features <ChevronRight className="w-5 h-5 opacity-30" />
                            </a>
                            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-lg font-bold text-secondary-black/70 hover:text-secondary-orange flex items-center justify-between">
                                How it Works <ChevronRight className="w-5 h-5 opacity-30" />
                            </a>
                            <div className="h-px bg-gray-100 my-2"></div>
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onGetStarted();
                                }}
                                className="bg-secondary-black text-white px-6 py-4 rounded-xl font-black text-lg hover:bg-secondary-orange transition-all shadow-lg active:scale-95 text-center"
                            >
                                Get Started
                            </button>
                        </nav>
                    </div>
                )}
            </header>
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-orange/5 via-transparent to-secondary-cyan/5 -z-10"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 bg-secondary-orange/10 text-secondary-orange px-5 py-2 rounded-full text-sm font-black mb-8 border border-secondary-orange/20">
                        <Sparkles className="w-4 h-4" />
                        <span className="uppercase tracking-[0.1em]">The Future of Service Discovery</span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-secondary-black mb-8 leading-[0.9] tracking-tighter">
                        SKILLS IN <br />
                        <span className="bg-gradient-to-r from-secondary-orange to-secondary-cyan bg-clip-text text-transparent">
                            MOTION
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-secondary-black/60 mb-12 max-w-2xl font-medium leading-relaxed">
                        Why rely on static reviews? Watch professionals demonstrate their craft through immersive videos. Transparency meets talent.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5">
                        <button
                            onClick={onGetStarted}
                            className="group bg-secondary-black text-white px-10 py-5 rounded-2xl font-black text-lg hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => onBrowse()}
                            className="bg-white text-secondary-black px-10 py-5 rounded-2xl font-black text-lg border-2 border-secondary-black hover:bg-gray-50 hover:shadow-xl transition-all duration-300"
                        >
                            Browse Feed
                        </button>
                    </div>

                    <div className="mt-20 relative w-full max-w-5xl hidden md:block">
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>

                        {/* Static Hero UI Cards - No shimmer/loading state */}
                        <div className="grid grid-cols-4 gap-6 opacity-60">
                            {[
                                { icon: Wrench, color: 'orange', label: 'Plumbing Pro', user: 'Mike T.' },
                                { icon: Zap, color: 'blue', label: 'Electric Fix', user: 'Sarah J.' },
                                { icon: HomeIcon, color: 'green', label: 'Deep Clean', user: 'CleanCo' },
                                { icon: Scissors, color: 'pink', label: 'Style Cut', user: 'BarberX' },
                            ].map((item, i) => (
                                <div key={i} className={`aspect-[9/16] bg-white rounded-3xl p-4 shadow-xl border border-gray-100 flex flex-col justify-between ${i % 2 === 0 ? 'translate-y-12' : ''}`}>
                                    <div className={`w-full aspect-square rounded-2xl bg-${item.color}-50 flex items-center justify-center mb-4`}>
                                        <item.icon className={`w-8 h-8 text-${item.color}-500`} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 w-2/3 bg-gray-100 rounded-full"></div>
                                        <div className="h-2 w-1/2 bg-gray-100 rounded-full"></div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                            {item.user.charAt(0)}
                                        </div>
                                        <div className="text-xs font-bold text-gray-400">{item.user}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-64 h-[450px] bg-secondary-black rounded-[3rem] border-[8px] border-white shadow-2xl p-4 overflow-hidden rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                            <div className="w-full h-full bg-gray-900 rounded-[2rem] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
                                <Video className="w-16 h-16 text-white mb-6 z-20 drop-shadow-lg" />
                                <h3 className="text-white text-2xl font-black uppercase tracking-tighter relative z-20">Live Demo</h3>
                                <p className="text-white/60 text-sm font-medium mt-2 relative z-20">Tap to watch real skills in action</p>

                                <div className="absolute bottom-8 left-6 right-6 z-20">
                                    <button className="w-full py-3 bg-secondary-orange text-white rounded-xl font-bold text-sm shadow-lg hover:bg-white hover:text-secondary-orange transition-colors">
                                        Browse Feed
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </section>


            {/* Platform Statistics Section */}
            <section className="py-16 bg-primary border-y border-secondary-black/10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
                        {/* Service Providers */}
                        <div ref={providersCount.ref} className="text-center font-balthazar">
                            <div className="flex items-center justify-center mb-2">
                                <Users className="w-8 h-8 text-secondary-orange" />
                            </div>
                            <div className="text-4xl md:text-5xl font-bold text-secondary-black mb-1">
                                {providersCount.count.toLocaleString()}+
                            </div>
                            <div className="text-sm md:text-base text-secondary-black/70 font-bold uppercase tracking-wider">Service Providers</div>
                        </div>

                        {/* Bookings Completed */}
                        <div ref={bookingsCount.ref} className="text-center font-balthazar">
                            <div className="flex items-center justify-center mb-2">
                                <CheckCircle className="w-8 h-8 text-secondary-cyan" />
                            </div>
                            <div className="text-4xl md:text-5xl font-bold text-secondary-black mb-1">
                                {bookingsCount.count.toLocaleString()}+
                            </div>
                            <div className="text-sm md:text-base text-secondary-black/70 font-bold uppercase tracking-wider">Bookings Completed</div>
                        </div>

                        {/* Average Rating */}
                        <div className="text-center font-balthazar">
                            <div className="flex items-center justify-center mb-2">
                                <Star className="w-8 h-8 text-secondary-yellow fill-secondary-yellow" />
                            </div>
                            <div className="text-4xl md:text-5xl font-bold text-secondary-black mb-1">{stats.avgRating}/5</div>
                            <div className="text-sm md:text-base text-secondary-black/70 font-bold uppercase tracking-wider">Average Rating</div>
                        </div>

                        {/* Service Categories */}
                        <div ref={categoriesCount.ref} className="text-center font-balthazar">
                            <div className="flex items-center justify-center mb-2">
                                <Zap className="w-8 h-8 text-secondary-cyan" />
                            </div>
                            <div className="text-4xl md:text-5xl font-bold text-secondary-black mb-1">
                                {categoriesCount.count}+
                            </div>
                            <div className="text-sm md:text-base text-secondary-black/70 font-bold uppercase tracking-wider">Service Categories</div>
                        </div>

                        {/* Total Reviews */}
                        <div className="text-center font-balthazar">
                            <div className="flex items-center justify-center mb-2">
                                <MessageCircle className="w-8 h-8 text-secondary-orange" />
                            </div>
                            <div className="text-4xl md:text-5xl font-bold text-secondary-black mb-1">
                                {stats.totalReviews.toLocaleString()}+
                            </div>
                            <div className="text-sm md:text-base text-secondary-black/70 font-bold uppercase tracking-wider">Happy Reviews</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                        <p className="text-xl text-gray-600">Simple, fast, and reliable</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="relative group">
                            <div className="bg-gradient-to-br from-secondary-orange/5 to-secondary-orange/10 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-secondary-orange/10">
                                <div className="bg-secondary-orange text-white w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-secondary-orange/20">
                                    <Video className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-secondary-black mb-3 italic">1. Watch Videos</h3>
                                <p className="text-secondary-black/70 font-bold">
                                    Browse through skill videos from verified service providers. See their work in action before you book.
                                </p>
                            </div>
                            <div className="absolute -top-4 -right-4 bg-secondary-orange text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-primary">
                                1
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="bg-purple-600 text-white w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">2. Book Service</h3>
                                <p className="text-gray-600">
                                    Choose your preferred date and time. Communicate directly with the provider through our chat system.
                                </p>
                            </div>
                            <div className="absolute -top-4 -right-4 bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                                2
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="bg-green-600 text-white w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Star className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">3. Rate & Review</h3>
                                <p className="text-gray-600">
                                    After service completion, share your experience to help others make informed decisions.
                                </p>
                            </div>
                            <div className="absolute -top-4 -right-4 bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                                3
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
                        <p className="text-xl text-gray-600">Real experiences from real people</p>
                    </div>

                    <div className="relative">
                        {/* Testimonials Grid */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            {testimonials.slice(currentIndex, currentIndex + 3).map((_, idx) => {
                                const actualIndex = (currentIndex + idx) % testimonials.length;
                                const actualTestimonial = testimonials[actualIndex];

                                return (
                                    <div
                                        key={actualTestimonial.id}
                                        className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        {/* Rating Stars */}
                                        <div className="flex gap-1 mb-4">
                                            {[...Array(actualTestimonial.rating)].map((_, i) => (
                                                <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                            ))}
                                        </div>

                                        {/* Testimonial Text */}
                                        <p className="text-gray-700 mb-6 leading-relaxed">"{actualTestimonial.text}"</p>

                                        {/* User Info */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {actualTestimonial.avatar}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{actualTestimonial.name}</div>
                                                <div className="text-sm text-gray-600">
                                                    {actualTestimonial.role} • {actualTestimonial.service}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={prev}
                                className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all hover:scale-110"
                                aria-label="Previous testimonials"
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-700" />
                            </button>

                            {/* Dot Indicators */}
                            <div className="flex gap-2">
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goTo(index)}
                                        className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                            ? 'bg-blue-600 w-8'
                                            : 'bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        aria-label={`Go to testimonial ${index + 1}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={next}
                                className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all hover:scale-110"
                                aria-label="Next testimonials"
                            >
                                <ChevronRight className="w-6 h-6 text-gray-700" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Categories */}
            <section id="categories" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Categories</h2>
                        <p className="text-xl text-gray-600">Find the service you need</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {categories.length > 0 ? categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => onBrowse(category.id)}
                                className="group bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-blue-600"
                            >
                                <div className={`bg-${category.color}-100 text-${category.color}-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                    <category.icon className="w-8 h-8" />
                                </div>
                                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                            </button>
                        )) : (
                            // Fallback/Loading state for categories
                            [1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl p-6 h-40"></div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Features Highlight Section */}
            <section id="features" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Platform Features</h2>
                        <p className="text-xl text-gray-600">Everything you need in one place</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Video,
                                title: 'Video Portfolios',
                                description: 'Watch providers showcase their skills through video demonstrations'
                            },
                            {
                                icon: Calendar,
                                title: 'Instant Booking',
                                description: 'Book services instantly with real-time availability'
                            },
                            {
                                icon: CreditCard,
                                title: 'Secure Payments',
                                description: 'Safe and secure payment processing for all transactions'
                            },
                            {
                                icon: MessageCircle,
                                title: 'Real-time Chat',
                                description: 'Communicate directly with service providers'
                            },
                            {
                                icon: Star,
                                title: 'Rating System',
                                description: 'Transparent reviews and ratings from real customers'
                            },
                            {
                                icon: Smartphone,
                                title: 'Mobile Friendly',
                                description: 'Access SkilXpress anywhere, anytime on any device'
                            }
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                            >
                                <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                                    <feature.icon className="w-7 h-7 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Why Choose SkilXpress? */}
            <section className="py-24 bg-primary border-y border-secondary-black/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-black text-secondary-black mb-4 tracking-tighter uppercase leading-none">
                            WHY THE <span className="text-secondary-cyan">PROS</span> <br />
                            CHOOSE US
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-16">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-secondary-orange/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform">
                                <Shield className="w-10 h-10 text-secondary-orange" />
                            </div>
                            <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Vetted Talent</h3>
                            <p className="text-secondary-black/60 font-medium">
                                We verify every provider so you don't have to. Real skills, real humans, real results.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-secondary-cyan/10 rounded-3xl flex items-center justify-center mb-8 -rotate-3 hover:rotate-0 transition-transform">
                                <Clock className="w-10 h-10 text-secondary-cyan" />
                            </div>
                            <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">On-Demand</h3>
                            <p className="text-secondary-black/60 font-medium">
                                Life is busy. Book and chat in seconds. Our platform is built for fast-paced living.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-secondary-yellow/10 rounded-3xl flex items-center justify-center mb-8 rotate-6 hover:rotate-0 transition-transform">
                                <DollarSign className="w-10 h-10 text-secondary-yellow" />
                            </div>
                            <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Transparent</h3>
                            <p className="text-secondary-black/60 font-medium">
                                Watch the video. See the price. Read the reviews. No surprises, just quality service.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-secondary-black mb-4 tracking-tight uppercase">Common Questions</h2>
                        <div className="w-20 h-1 bg-secondary-orange mx-auto"></div>
                    </div>

                    <div className="space-y-6">
                        {[
                            { q: "Is SkilXpress free for clients?", a: "Yes, browsing and booking through SkilXpress is free for clients. You only pay for the services you receive directly to the provider." },
                            { q: "How are service providers verified?", a: "We verify providers through identity checks and skill validation. Our community review system also ensures only the best pros thrive." },
                            { q: "Can I cancel a booking?", a: "Yes, you can cancel or reschedule bookings through our real-time chat and booking management system." },
                            { q: "What if I'm not satisfied with the service?", a: "We encourage open communication through our chat. You can also leave a review and our support team is available 24/7 to mediate if needed." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-lg text-secondary-black mb-2">{item.q}</h4>
                                <p className="text-secondary-black/60 font-medium leading-relaxed">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-secondary-black -z-10"></div>
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
                        READY TO HIRE THE <br />
                        <span className="text-secondary-cyan italic">WORLD'S BEST?</span>
                    </h2>
                    <p className="text-lg md:text-xl text-white/50 mb-12 font-medium">
                        Stop guessing. Start watching. Join the skill revolution today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <button
                            onClick={onGetStarted}
                            className="bg-white text-secondary-black px-10 py-5 rounded-2xl font-black text-lg hover:bg-secondary-orange hover:text-white hover:shadow-[0_20px_50px_rgba(245,124,0,0.3)] transition-all duration-300 active:scale-95"
                        >
                            Start Now — It's Free
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-20 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12">
                                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-2xl font-black tracking-tighter">SkilXpress</span>
                            </div>
                            <p className="text-secondary-black/50 font-medium leading-relaxed">
                                Redefining professional services through the power of video. The most transparent way to hire.
                            </p>
                        </div>
                        <div>
                            <h5 className="font-black uppercase tracking-widest text-xs mb-6 text-secondary-black/40">Platform</h5>
                            <ul className="space-y-4">
                                <li><button onClick={() => onBrowse()} className="font-bold hover:text-secondary-orange transition-colors">Browse Feed</button></li>
                                <li><a href="#categories" className="font-bold hover:text-secondary-orange transition-colors">Categories</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-black uppercase tracking-widest text-xs mb-6 text-secondary-black/40">Company</h5>
                            <ul className="space-y-4">
                                <li><button onClick={() => openInfoModal('About Us', contents.about)} className="font-bold hover:text-secondary-orange transition-colors text-left">About Us</button></li>
                                <li><button onClick={() => openInfoModal('Privacy Policy', contents.privacy)} className="font-bold hover:text-secondary-orange transition-colors text-left">Privacy Policy</button></li>
                                <li><button onClick={() => openInfoModal('Terms of Service', contents.terms)} className="font-bold hover:text-secondary-orange transition-colors text-left">Terms of Service</button></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-black uppercase tracking-widest text-xs mb-6 text-secondary-black/40">Support</h5>
                            <ul className="space-y-4">
                                <li><button onClick={() => openInfoModal('Help Center', contents.help)} className="font-bold hover:text-secondary-orange transition-colors text-left">Help Center</button></li>
                                <li><button onClick={() => openInfoModal('Community', contents.community)} className="font-bold hover:text-secondary-orange transition-colors text-left">Community</button></li>
                                <li><button onClick={() => openInfoModal('Safe Booking', contents.safe)} className="font-bold hover:text-secondary-orange transition-colors text-left">Safe Booking</button></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-secondary-black/40 text-sm font-bold">
                            © 2024 SKILXPRESS PRO CONNECT. ALL RIGHTS RESERVED.
                        </p>
                        <div className="flex gap-8">
                            <button className="text-sm font-black uppercase tracking-widest hover:text-secondary-orange transition-all">Instagram</button>
                            <button className="text-sm font-black uppercase tracking-widest hover:text-secondary-orange transition-all">LinkedIn</button>
                            <button className="text-sm font-black uppercase tracking-widest hover:text-secondary-orange transition-all">Twitter</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
