import { Sparkles, Video, Calendar, Star, ArrowRight, Wrench, Home as HomeIcon, Scissors, Car, Zap, Users, CheckCircle, Shield, Clock, DollarSign, MessageCircle, CreditCard, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';
import { useCarousel } from '../hooks/useCarousel';

interface LandingPageProps {
    onGetStarted: () => void;
}

// Sample testimonials data
const testimonials = [
    {
        id: 1,
        name: "Sarah Johnson",
        role: "Client",
        rating: 5,
        text: "Found an amazing plumber through SkilXpress! The video portfolio helped me choose the right professional. Highly recommend!",
        service: "Plumbing",
        avatar: "SJ"
    },
    {
        id: 2,
        name: "Michael Chen",
        role: "Provider",
        rating: 5,
        text: "As a photographer, SkilXpress has been a game-changer. I get more bookings by showcasing my work through videos!",
        service: "Photography",
        avatar: "MC"
    },
    {
        id: 3,
        name: "Emily Rodriguez",
        role: "Client",
        rating: 5,
        text: "The booking process was so smooth! I could see the provider's previous work and read reviews before booking. Perfect!",
        service: "Haircut",
        avatar: "ER"
    },
    {
        id: 4,
        name: "David Kim",
        role: "Provider",
        rating: 5,
        text: "Best platform for service providers! The video feature really helps clients understand the quality of my work.",
        service: "Auto Repair",
        avatar: "DK"
    },
    {
        id: 5,
        name: "Lisa Thompson",
        role: "Client",
        rating: 5,
        text: "I love how transparent everything is. Seeing the provider's skills through videos gave me confidence in my choice!",
        service: "Cleaning",
        avatar: "LT"
    },
    {
        id: 6,
        name: "James Wilson",
        role: "Provider",
        rating: 5,
        text: "SkilXpress helped me grow my business significantly. The platform is easy to use and brings quality clients!",
        service: "Electrical",
        avatar: "JW"
    }
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
    // Animated counters
    const providersCount = useCountUp(10000);
    const bookingsCount = useCountUp(50000);
    const categoriesCount = useCountUp(100);

    // Testimonials carousel
    const { currentIndex, next, prev, goTo } = useCarousel(testimonials.length, 5000);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-3xl"></div>
                <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-pulse">
                            <Sparkles className="w-4 h-4" />
                            <span>Discover Skills Through Video</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                            Find Skilled Professionals
                            <br />
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Through Video
                            </span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                            Watch service providers showcase their skills in action. Book trusted professionals with confidence.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={onGetStarted}
                                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={onGetStarted}
                                className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-600 hover:shadow-lg transition-all duration-300"
                            >
                                Browse Services
                            </button>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </section>

            {/* Platform Statistics Section */}
            <section className="py-16 bg-white border-y border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {/* Service Providers */}
                        <div ref={providersCount.ref} className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-1">
                                {providersCount.count.toLocaleString()}+
                            </div>
                            <div className="text-sm md:text-base text-gray-600 font-medium">Service Providers</div>
                        </div>

                        {/* Bookings Completed */}
                        <div ref={bookingsCount.ref} className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-1">
                                {bookingsCount.count.toLocaleString()}+
                            </div>
                            <div className="text-sm md:text-base text-gray-600 font-medium">Bookings Completed</div>
                        </div>

                        {/* Average Rating */}
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                            </div>
                            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-1">4.8/5</div>
                            <div className="text-sm md:text-base text-gray-600 font-medium">Average Rating</div>
                        </div>

                        {/* Service Categories */}
                        <div ref={categoriesCount.ref} className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Zap className="w-8 h-8 text-purple-600" />
                            </div>
                            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-1">
                                {categoriesCount.count}+
                            </div>
                            <div className="text-sm md:text-base text-gray-600 font-medium">Service Categories</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                        <p className="text-xl text-gray-600">Simple, fast, and reliable</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="relative group">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="bg-blue-600 text-white w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Video className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">1. Watch Videos</h3>
                                <p className="text-gray-600">
                                    Browse through skill videos from verified service providers. See their work in action before you book.
                                </p>
                            </div>
                            <div className="absolute -top-4 -right-4 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
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
                            {testimonials.slice(currentIndex, currentIndex + 3).map((testimonial, idx) => {
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
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Categories</h2>
                        <p className="text-xl text-gray-600">Find the service you need</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {[
                            { icon: Wrench, name: 'Plumbing', color: 'blue' },
                            { icon: Zap, name: 'Electrical', color: 'yellow' },
                            { icon: HomeIcon, name: 'Cleaning', color: 'green' },
                            { icon: Scissors, name: 'Haircut', color: 'purple' },
                            { icon: Car, name: 'Auto Repair', color: 'red' },
                            { icon: Video, name: 'Photography', color: 'pink' },
                        ].map((category) => (
                            <button
                                key={category.name}
                                onClick={onGetStarted}
                                className="group bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-blue-600"
                            >
                                <div className={`bg-${category.color}-100 text-${category.color}-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                    <category.icon className="w-8 h-8" />
                                </div>
                                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Highlight Section */}
            <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
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

            {/* Trust Indicators Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose SkilXpress?</h2>
                        <p className="text-xl text-gray-600">Your trust is our priority</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Verified Providers</h3>
                            <p className="text-gray-600 max-w-sm mx-auto">
                                All service providers are verified and background-checked for your safety and peace of mind.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Clock className="w-10 h-10 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">24/7 Support</h3>
                            <p className="text-gray-600 max-w-sm mx-auto">
                                Our dedicated support team is always here to help you with any questions or concerns.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-gradient-to-br from-green-100 to-green-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <DollarSign className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Best Price Guarantee</h3>
                            <p className="text-gray-600 max-w-sm mx-auto">
                                Competitive pricing with transparent quotes. No hidden fees, ever.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10">
                        Join thousands of satisfied customers finding trusted service providers
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        Sign Up Now
                    </button>
                </div>
            </section>
        </div>
    );
}
