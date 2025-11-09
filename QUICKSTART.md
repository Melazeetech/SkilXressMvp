# SkilXpress - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js v16+
- npm or yarn

### Step 1: Install & Run

```bash
# Navigate to project directory
cd /path/to/skilxpress

# Install dependencies
npm install

# Start development server
npm run dev
```

The app opens at `http://localhost:5173`

### Step 2: Create an Account

**As a Client:**
1. Click "Get Started" on the welcome page
2. Select "Find Services"
3. Enter your details (name, email, password)
4. Click "Create Account"

**As a Provider:**
1. Click "Get Started" on the welcome page
2. Select "Offer Services"
3. Enter your details
4. Select your skills (or add custom ones)
5. Click "Create Account"

### Step 3: Try Features

**Browse Videos (Clients)**:
- Scroll through the video feed
- Double-tap to like
- Click the share button to share profiles
- Click provider names to view profiles

**Upload Videos (Providers)**:
- Go to Dashboard → Videos
- Click "Add Video"
- Choose upload method (URL or local file)
- Fill in details and upload

**Make a Booking (Clients)**:
- Click "Book Now" on any video
- Select date, time, location
- Add notes if needed
- Click "Confirm Booking"

**Chat with Providers**:
- Go to Dashboard → Bookings
- Click "Chat" on any booking
- Send messages in real-time

**Add Portfolio (Providers)**:
- Go to Dashboard → Portfolio
- Click "Add Work"
- Upload image and add description
- View in your profile

**Follow Providers**:
- Click on a provider's profile
- Click "Follow" button
- See follower count increase

## 🎨 Key Features

| Feature | User Type | Location |
|---------|-----------|----------|
| Video Feed | Client | Home Tab |
| Search/Filter | Client | Top of feed |
| Book Service | Client | Book Now button |
| View Profile | Client | Click provider name |
| Follow Provider | Client | Provider profile |
| Rate Service | Client | Dashboard → Completed |
| Upload Videos | Provider | Dashboard → Videos |
| Manage Bookings | Provider | Dashboard → Bookings |
| Add Portfolio | Provider | Dashboard → Portfolio |
| Chat | Both | Dashboard or Feed |

## 🗄️ Database Status

✅ **Supabase Connected**
- Live database: `https://ucohxnoanqitcuegxbpg.supabase.co`
- All tables created and ready
- Authentication active
- Real-time messaging enabled

### Setup Storage Buckets (Optional)

For local video/image uploads:

1. Go to Supabase Dashboard → Storage
2. Create bucket: `skill-videos` (Public)
3. Create bucket: `portfolio-images` (Public)

Or use URLs to external videos/images.

## 📱 Responsive Design

Works perfectly on:
- ✅ Mobile phones
- ✅ Tablets
- ✅ Desktop computers
- ✅ All modern browsers

## 🔐 Security

- Email/password authentication
- Row Level Security on all data
- Each user sees only their data
- Secure session management

## 📊 What's Included

- 11 React components
- 10 database tables
- Real-time chat
- Video feed (TikTok-style)
- Booking system
- Profile management
- Portfolio showcase
- Follow system
- Search & filters

## 🚢 Deploy to Production

```bash
# Build for production
npm run build

# Deploy dist/ folder to:
# - Vercel (npm install -g vercel && vercel)
# - Netlify (npm install -g netlify-cli && netlify deploy --prod --dir=dist)
# - GitHub Pages, Firebase, AWS, etc.
```

## 📚 Full Documentation

- `PROJECT_SUMMARY.md` - Complete feature list
- `SETUP_GUIDE.md` - Detailed setup instructions
- `FEATURES.md` - All features explained
- `SUPABASE_STORAGE_SETUP.md` - Storage configuration

## 🐛 Troubleshooting

**App won't start?**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Videos not uploading?**
- Check file format (MP4, WebM, etc.)
- Ensure file size < 100MB
- Verify internet connection

**Chat not working?**
- Both users must have active bookings
- Refresh page if needed
- Check browser console for errors

**Can't see follower count?**
- Refresh the page
- Make sure you're logged in
- Check provider profile

## 💡 Tips

1. **Test Both Roles**: Create two accounts (client + provider)
2. **Use External URLs**: Easy way to test without uploads
3. **Check Console**: Browser console shows helpful debug info
4. **Mobile First**: App is optimized for mobile use
5. **Read Docs**: Full documentation in project folder

## 🎯 Next Steps

1. ✅ Explore all features in development mode
2. ✅ Test bookings and messaging
3. ✅ Try uploading videos and portfolio items
4. ✅ Check mobile responsiveness
5. ✅ Review documentation
6. ✅ Deploy to production
7. ✅ Customize branding/colors
8. ✅ Add your own categories

## 📞 Support Resources

- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Vite Docs: https://vitejs.dev

---

**Ready to go!** 🚀 Start exploring SkilXpress now.
