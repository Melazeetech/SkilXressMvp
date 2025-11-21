const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Search to imports
content = content.replace(
    "import { Home, User, LogOut, Menu, X, MessageSquare, Bell } from 'lucide-react';",
    "import { Home, User, LogOut, Menu, X, MessageSquare, Bell, Search } from 'lucide-react';"
);

// 2. Add searchModalOpen state (after menuOpen)
content = content.replace(
    /  const \[menuOpen, setMenuOpen\] = useState\(false\);\r?\n  const \[activeBookingId/,
    `  const [menuOpen, setMenuOpen] = useState(false);\r\n  const [searchModalOpen, setSearchModalOpen] = useState(false);\r\n  const [activeBookingId`
);

// 3. Add back handler (after profileModalOpen handler)
content = content.replace(
    /  useBackHandler\(profileModalOpen, \(\) => setProfileModalOpen\(false\), 'profile-modal'\);\r?\n  useBackHandler\(providerProfileOpen/,
    `  useBackHandler(profileModalOpen, () => setProfileModalOpen(false), 'profile-modal');\r\n  useBackHandler(searchModalOpen, () => setSearchModalOpen(false), 'search-modal');\r\n  useBackHandler(providerProfileOpen`
);

// 4. Add search button (after Home button, before messages button)
const searchButton = `                <button
                  onClick={() => setSearchModalOpen(true)}
                  className={\`p-2 rounded-full transition-colors \${currentView === 'feed'
                    ? 'text-white hover:bg-white/20'
                    : 'text-gray-600 hover:bg-gray-100'
                    }\`}
                >
                  <Search className="w-5 h-5" />
                </button>
`;

content = content.replace(
    /(                  <Home className="w-5 h-5" \/>\r?\n                <\/button>\r?\n)(                <button\r?\n                  onClick=\{\(\) => setCurrentView\('messages'\)\})/,
    `$1${searchButton}$2`
);

// 5. Remove overlay SearchBar
const overlayPattern = /            \{user && \(\r?\n              <div className="fixed top-14 left-0 right-0 z-40 px-4 pointer-events-none">\r?\n                <div className="max-w-md mx-auto pointer-events-auto">\r?\n                  <SearchBar\r?\n                    onSearch=\{setSearchQuery\}\r?\n                    onCategoryFilter=\{setCategoryFilter\}\r?\n                    onLocationFilter=\{setLocationFilter\}\r?\n                  \/>\r?\n                <\/div>\r?\n              <\/div>\r?\n            \)\}\r?\n/;
content = content.replace(overlayPattern, '');

// 6. Add modal rendering (before closing div of AppContent)
const modalCode = `
      {searchModalOpen && (
        <SearchBar
          onSearch={setSearchQuery}
          onCategoryFilter={setCategoryFilter}
          onLocationFilter={setLocationFilter}
          onClose={() => setSearchModalOpen(false)}
        />
      )}`;

// Find the ProviderProfilePage closing and add modal before final </div>
content = content.replace(
    /(        \/>\r?\n      \)\})\r?\n(    <\/div>\r?\n  \);\r?\n\})/,
    `$1${modalCode}\r\n$2`
);

// Write the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Successfully updated App.tsx');
