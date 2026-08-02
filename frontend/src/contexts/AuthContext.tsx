import React, { createContext, useContext } from 'react'
import { ClerkProvider, useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''
const IS_CLERK_CONFIGURED =
  Boolean(PUBLISHABLE_KEY) &&
  PUBLISHABLE_KEY.startsWith('pk_') &&
  !PUBLISHABLE_KEY.includes('placeholder')

interface SafeAuthContextType {
  isLoaded: boolean
  isSignedIn: boolean
  user: any
  getToken: () => Promise<string | null>
  isClerkConfigured: boolean
}

const SafeAuthContext = createContext<SafeAuthContextType>({
  isLoaded: true,
  isSignedIn: false,
  user: null,
  getToken: async () => null,
  isClerkConfigured: false,
})

function InternalClerkConsumer({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const { user } = useClerkUser()

  return (
    <SafeAuthContext.Provider
      value={{
        isLoaded: isLoaded ?? true,
        isSignedIn: isSignedIn ?? false,
        user: user ?? null,
        getToken: async () => {
          try {
            return await getToken()
          } catch {
            return null
          }
        },
        isClerkConfigured: true,
      }}
    >
      {children}
    </SafeAuthContext.Provider>
  )
}

export function SafeAuthProvider({ children }: { children: React.ReactNode }) {
  if (!IS_CLERK_CONFIGURED) {
    return (
      <SafeAuthContext.Provider
        value={{
          isLoaded: true,
          isSignedIn: false,
          user: null,
          getToken: async () => null,
          isClerkConfigured: false,
        }}
      >
        {children}
      </SafeAuthContext.Provider>
    )
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <InternalClerkConsumer>{children}</InternalClerkConsumer>
    </ClerkProvider>
  )
}

export function useSafeAuth() {
  return useContext(SafeAuthContext)
}
