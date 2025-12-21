import { useState, useEffect } from 'react';
import { X, Loader2, Camera, User, Lock, Eye, Shield, Trash2, LogOut, Settings, Phone, MapPin, Briefcase, Star, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ProfileCompletionMeter } from './ProfileCompletionMeter';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');

  // Profile State
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Account State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [passLoading, setPassLoading] = useState(false);
  const [totalVideos, setTotalVideos] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchStats();
    }
  }, [user?.id]);

  const fetchStats = async () => {
    try {
      const { count } = await supabase
        .from('skill_videos')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', user!.id);
      setTotalVideos(count || 0);
    } catch (e) {
      console.warn('Error fetching stats for completion meter:', e);
    }
  };

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setPhone(profile.phone || '');
      setLocation(profile.location || '');
      setExperience(profile.experience || '');
      setSpecialty(profile.specialty || '');
      setAvatarUrl(profile.avatar_url || '');
      setAvatarPreview(profile.avatar_url || '');
      setIsPublic(profile.is_public !== false); // Default to true
    }
  }, [profile, isOpen]);

  if (!isOpen || !user) return null;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const { uploadAvatar } = await import('../lib/uploadHelpers');
        finalAvatarUrl = await uploadAvatar(avatarFile, user.id);
      }

      const { error } = await supabase
        .from('profiles')
        // @ts-ignore
        .update({
          full_name: fullName,
          bio: bio,
          phone: phone,
          location: location,
          experience: experience,
          specialty: specialty,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      if (refreshProfile) await refreshProfile();
      toast.success('Profile updated successfully');

      // Clean up preview
      if (avatarFile && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPassLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setPassLoading(false);
    }
  };

  const handleVisibilityToggle = async () => {
    try {
      const newValue = !isPublic;
      const { error } = await supabase
        .from('profiles')
        // @ts-ignore
        .update({ is_public: newValue })
        .eq('id', user.id);

      if (error) throw error;
      setIsPublic(newValue);
      toast.success(`Profile is now ${newValue ? 'Public' : 'Private'}`);
      if (refreshProfile) await refreshProfile();
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const handleDeactivateAccount = async () => {
    if (!confirm('Are you sure you want to deactivate your account? This action cannot be undone immediately.')) return;

    try {
      // Soft delete or status update
      const { error } = await supabase
        .from('profiles')
        // @ts-ignore
        .update({ status: 'deactivated' })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Account deactivated');
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast.error('Failed to deactivate account');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">

        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-4 md:p-6 flex flex-col shrink-0">
          <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-8 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Settings
          </h2>

          <nav className="flex flex-row md:flex-col gap-2 md:gap-0 md:space-y-2 overflow-x-auto md:overflow-visible no-scrollbar">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-3 px-4 py-2 md:py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'profile'
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
            >
              <User className="w-5 h-5" />
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-3 px-4 py-2 md:py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'account'
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
            >
              <Shield className="w-5 h-5" />
              Account & Security
            </button>
          </nav>

          <div className="pt-6 border-t border-gray-200 hidden md:block mt-auto">
            <button
              onClick={onClose}
              className="w-full flex items-center gap-2 text-gray-500 hover:text-gray-900 px-4 py-2"
            >
              <LogOut className="w-4 h-4" />
              Close Settings
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'profile' ? 'Edit Profile' : 'Account & Security'}
              </h1>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Completion Meter */}
            {activeTab === 'profile' && profile?.user_type === 'provider' && (
              <ProfileCompletionMeter profile={profile} stats={{ totalVideos }} />
            )}

            {activeTab === 'profile' ? (
              <form onSubmit={handleProfileUpdate} className="space-y-8">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 ring-4 ring-white shadow-lg">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          <User className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                      <Camera className="w-6 h-6" />
                      <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Profile Photo</h3>
                    <p className="text-sm text-gray-500 mt-1">Click the photo to upload a new one.</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  {profile?.user_type === 'provider' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" /> Experience
                        </label>
                        <input
                          type="text"
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="e.g. 5 Years, Senior Level"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Star className="w-4 h-4" /> Specialty
                        </label>
                        <input
                          type="text"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="e.g. Wedding Photography, Plumbing"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-10">
                {/* Change Password */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-gray-500" />
                    Change Password
                  </h3>
                  <form onSubmit={handlePasswordChange} className="bg-gray-50 p-6 rounded-xl space-y-4 border border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={passLoading || !newPassword}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium"
                      >
                        {passLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Privacy */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-gray-500" />
                    Privacy & Visibility
                  </h3>
                  <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {isPublic ? 'Your profile is visible to everyone.' : 'Your profile is hidden from search results.'}
                      </p>
                    </div>
                    <button
                      onClick={handleVisibilityToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isPublic ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </section>

                {/* Danger Zone */}
                <section>
                  <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Danger Zone
                  </h3>
                  <div className="bg-red-50 border border-red-100 p-6 rounded-xl">
                    <h4 className="font-medium text-red-900">Deactivate Account</h4>
                    <p className="text-sm text-red-700 mt-1 mb-4">
                      This will hide your profile and all your listings. You can reactivate it later by logging in.
                    </p>
                    <button
                      onClick={handleDeactivateAccount}
                      className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deactivate Account
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
