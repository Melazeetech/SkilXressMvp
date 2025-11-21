import re

# Read the file
with open(r'src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Search to imports
content = re.sub(
    r"import \{ Home, User, LogOut, Menu, X, MessageSquare, Bell \} from 'lucide-react';",
    "import { Home, User, LogOut, Menu, X, MessageSquare, Bell, Search } from 'lucide-react';",
    content
)

# 2. Add searchModalOpen state (after menuOpen)
content = re.sub(
    r'(  const \[menuOpen, setMenuOpen\] = useState\(false\);)\r?\n(  const \[activeBookingId)',
    r'\1\r\n  const [searchModalOpen, setSearchModalOpen] = useState(false);\r\n\2',
    content
)

# 3. Add back handler (after profileModalOpen handler)
content = re.sub(
    r"(  useBackHandler\(profileModalOpen, \(\) => setProfileModalOpen\(false\), 'profile-modal'\);)\r?\n(  useBackHandler\(providerProfileOpen)",
    r"\1\r\n  useBackHandler(searchModalOpen, () => setSearchModalOpen(false), 'search-modal');\r\n\2",
    content
)

# 4. Add search button (after Home button, before messages button)
search_button = '''                <button
                  onClick={() => setSearchModalOpen(true)}
                  className={`p-2 rounded-full transition-colors ${currentView === 'feed'
                    ? 'text-white hover:bg-white/20'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <Search className="w-5 h-5" />
                </button>
'''

content = re.sub(
    r'(                  <Home className="w-5 h-5" />\r?\n                </button>\r?\n)(                <button\r?\n                  onClick=\{\(\) => setCurrentView\(\'messages\'\)\})',
    r'\1' + search_button + r'\2',
    content
)

# 5. Remove overlay SearchBar
overlay_pattern = r'            \{user && \(\r?\n              <div className="fixed top-14 left-0 right-0 z-40 px-4 pointer-events-none">\r?\n                <div className="max-w-md mx-auto pointer-events-auto">\r?\n                  <SearchBar\r?\n                    onSearch=\{setSearchQuery\}\r?\n                    onCategoryFilter=\{setCategoryFilter\}\r?\n                    onLocationFilter=\{setLocationFilter\}\r?\n                  />\r?\n                </div>\r?\n              </div>\r?\n            \)\}\r?\n'
content = re.sub(overlay_pattern, '', content)

# 6. Add modal rendering (before closing div of AppContent)
modal_code = '''
      {searchModalOpen && (
        <SearchBar
          onSearch={setSearchQuery}
          onCategoryFilter={setCategoryFilter}
          onLocationFilter={setLocationFilter}
          onClose={() => setSearchModalOpen(false)}
        />
      )}'''

# Find the ProviderProfilePage closing and add modal before final </div>
content = re.sub(
    r'(        />\r?\n      \)\})\r?\n(    </div>\r?\n  \);\r?\n\})',
    r'\1' + modal_code + '\r\n\2',
    content
)

# Write the file
with open(r'src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully updated App.tsx')
