import { ArrowLeft } from 'lucide-react';
import { useBackHandler } from '../hooks/useBackHandler';

interface PrivacyPolicyProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PrivacyPolicy({ isOpen, onClose }: PrivacyPolicyProps) {
    useBackHandler(isOpen, onClose, 'privacy-policy');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white z-[100] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center shadow-sm z-10">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
            </div>

            <div className="max-w-3xl mx-auto p-6 space-y-6 text-gray-700 pb-20">
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">1. Introduction</h2>
                    <p>
                        Welcome to SkilXpress. We respect your privacy and are committed to protecting your personal data.
                        This privacy policy will inform you as to how we look after your personal data when you visit our application.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">2. Data We Collect</h2>
                    <p className="mb-2">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Identity Data:</strong> includes first name, last name, username, or similar identifier.</li>
                        <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                        <li><strong>Profile Data:</strong> includes your username, password, bookings made by you, your interests, preferences, and feedback.</li>
                        <li><strong>Usage Data:</strong> includes information about how you use our app, products, and services.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">3. How We Use Your Data</h2>
                    <p>
                        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>To allow you to book services with providers.</li>
                        <li>To manage our relationship with you.</li>
                        <li>To improve our website, products/services, marketing, customer relationships, and experiences.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">4. Data Security</h2>
                    <p>
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">5. Contact Us</h2>
                    <p>
                        If you have any questions about this privacy policy or our privacy practices, please contact us within the app support section.
                    </p>
                </section>

                <div className="pt-8 border-t border-gray-100 text-sm text-gray-500">
                    Last Updated: December 2025
                </div>
            </div>
        </div>
    );
}
