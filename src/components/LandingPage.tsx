import { Sparkles, Video, Calendar, Star, ArrowRight, Wrench, Home as HomeIcon, Scissors, Car, Zap } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
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

            {/* Featured Categories */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
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
