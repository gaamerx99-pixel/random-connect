import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  VideoCameraIcon,
  ChevronDownIcon,
  UserIcon,
  PencilSquareIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { useSafeAuth } from '../../contexts/AuthContext'

interface HeaderProps {
  displayName?: string
}

export function Header({ displayName: propName }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isSignedIn, user, signOut } = useSafeAuth()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const notificationRef = useRef<HTMLDivElement | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  const activePath = location.pathname

  const clerkName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.firstName ||
    user?.username ||
    ''

  const effectiveName = propName || clerkName || (isSignedIn ? 'Shivam' : 'Guest')
  const userInitial = (effectiveName.charAt(0) || 'U').toUpperCase()
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    (isSignedIn ? 'user@randomconnect.app' : 'guest@randomconnect.app')

  const navLinks = [
    { label: 'Video Match', path: '/waiting' },
    { label: 'Profile', path: '/profile' },
    { label: 'Friends', path: '/friends' },
  ]

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotifications(false)
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowNotifications(false)
        setShowProfileMenu(false)
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Handle Mark Read
  const handleMarkRead = () => {
    setHasUnreadNotification(false)
    setShowNotifications(false)
  }

  // Handle Sign Out
  const handleSignOut = async () => {
    setShowProfileMenu(false)
    try {
      await signOut()
    } catch (err) {
      console.warn('Signout notice:', err)
    }
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-xs select-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer shrink-0"
          aria-label="RandomConnect Home"
          title="RandomConnect Home"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition group-hover:bg-indigo-700">
            <VideoCameraIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-gray-900 group-hover:text-gray-950 transition">
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

        {/* Right: Notifications & Unified Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* 1. Notifications Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowProfileMenu(false)
              }}
              className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              aria-label="Notifications"
              type="button"
            >
              <BellIcon className="h-5 w-5" />
              {hasUnreadNotification && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="font-bold text-gray-900 border-b border-gray-100 pb-2.5 mb-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>Notifications</span>
                    {hasUnreadNotification && (
                      <span className="rounded-full bg-indigo-50 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-600">
                        1 New
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hasUnreadNotification && (
                      <button
                        onClick={handleMarkRead}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                        type="button"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="rounded-lg p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                      title="Close notifications"
                      type="button"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-gray-600">
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/70 text-gray-800">
                    <p className="font-semibold text-indigo-950 flex items-center justify-between">
                      <span>Welcome to RandomConnect!</span>
                      <span className="text-[10px] text-indigo-500 font-normal">Just now</span>
                    </p>
                    <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                      Start matching to meet real users and make new friends instantly.
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
                  <span>Press Esc to close</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
                    type="button"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. UNIFIED SINGLE PROFILE DROPDOWN (Replaces duplicate profile elements) */}
          <div className="relative pl-1 border-l border-gray-100" ref={profileMenuRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu)
                setShowNotifications(false)
              }}
              className="flex items-center gap-2 rounded-xl py-1 px-1.5 sm:px-2.5 hover:bg-gray-100 transition cursor-pointer border border-transparent hover:border-gray-200"
              aria-label="User profile menu"
              type="button"
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={effectiveName}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-600/20"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-700 text-xs font-bold text-white shadow-sm ring-2 ring-indigo-600/20">
                  {userInitial}
                </div>
              )}
              <span className="hidden sm:inline text-sm font-semibold text-gray-800 max-w-[120px] truncate">
                {effectiveName}
              </span>
              <ChevronDownIcon
                className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${
                  showProfileMenu ? 'rotate-180 text-indigo-600' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                {/* User Header Details */}
                <div className="p-3 border-b border-gray-100 flex items-center gap-3">
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={effectiveName}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-600/20 shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-700 text-sm font-bold text-white shadow-sm ring-2 ring-indigo-600/20 shrink-0">
                      {userInitial}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{effectiveName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-semibold text-emerald-600">Online</span>
                    </div>
                  </div>
                </div>

                {/* Navigable Menu Items */}
                <div className="py-1.5 space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition font-medium cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span>View Profile</span>
                  </Link>

                  <Link
                    to="/profile/edit"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition font-medium cursor-pointer"
                  >
                    <PencilSquareIcon className="h-4 w-4 text-gray-400" />
                    <span>Edit Profile</span>
                  </Link>

                  <Link
                    to="/friends"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition font-medium cursor-pointer"
                  >
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                    <span>Friends</span>
                  </Link>

                  <Link
                    to="/safety"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition font-medium cursor-pointer"
                  >
                    <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
                    <span>Safety & Guidelines</span>
                  </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-1" />

                {/* Logout Action */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition font-semibold text-xs cursor-pointer"
                  type="button"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition cursor-pointer"
            aria-label="Toggle navigation menu"
            type="button"
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
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition ${
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
