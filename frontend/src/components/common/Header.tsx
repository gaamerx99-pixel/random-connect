import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import {
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  VideoCameraIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { useSafeAuth } from '../../contexts/AuthContext'

interface HeaderProps {
  displayName?: string
}

export function Header({ displayName: propName }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isSignedIn, user, isClerkConfigured } = useSafeAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const activePath = location.pathname

  const clerkName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.firstName ||
    user?.username ||
    ''

  const effectiveName = propName || clerkName || (isSignedIn ? 'Shivam' : 'Guest')
  const userInitial = effectiveName.charAt(0).toUpperCase() || 'U'

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Video Match', path: '/waiting' },
    { label: 'Profile', path: '/profile' },
    { label: 'Friends', path: '/friends' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group cursor-pointer"
          aria-label="RandomConnect Home"
          title="RandomConnect Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition group-hover:bg-indigo-700">
            <VideoCameraIcon className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-gray-950 transition">
            Random<span className="text-indigo-600">Connect</span>
          </span>
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const isActive =
              activePath === link.path ||
              (link.path === '/profile' && activePath.startsWith('/profile'))

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-[-14px] left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right: Notifications, User Avatar & Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              aria-label="Notifications"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg z-50 text-xs">
                <div className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-2 flex justify-between items-center">
                  <span>Notifications</span>
                  <span className="text-[10px] text-indigo-600 font-medium cursor-pointer">Mark read</span>
                </div>
                <div className="space-y-2 text-gray-600">
                  <div className="p-2 rounded-lg bg-indigo-50/50 text-gray-800">
                    <p className="font-medium text-indigo-900">Welcome to RandomConnect!</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Start matching to meet interesting people.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill / Clerk Button */}
          <div className="flex items-center gap-2 pl-1 border-l border-gray-100">
            {isClerkConfigured && isSignedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-lg py-1 px-1.5 hover:bg-gray-50 transition"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                    {userInitial}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-800 max-w-[120px] truncate">
                    {effectiveName}
                  </span>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg py-1 px-1.5 hover:bg-gray-50 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                  {userInitial}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-800">
                  {effectiveName}
                </span>
                <ChevronDownIcon className="hidden sm:block h-3.5 w-3.5 text-gray-400" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-md">
          {navLinks.map((link) => {
            const isActive =
              activePath === link.path ||
              (link.path === '/profile' && activePath.startsWith('/profile'))

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
