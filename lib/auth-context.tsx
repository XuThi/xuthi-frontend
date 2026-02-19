"use client"

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    ReactNode,
} from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
    id: string
    email: string
    firstName?: string
    lastName?: string
    avatarUrl?: string
    emailConfirmed?: boolean
    roles?: string[]
}

interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (
        email: string,
        password: string,
    ) => Promise<{ success: boolean; error?: string; emailConfirmed?: boolean }>
    register: (
        email: string,
        password: string,
        firstName?: string,
        lastName?: string,
    ) => Promise<{ success: boolean; error?: string; emailConfirmed?: boolean }>
    loginWithGoogle: () => void
    loginWithFacebook: () => void
    logout: () => void
    refreshUser: () => Promise<void>
    resendVerificationEmail: (
        email: string,
    ) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_URL = "/api/bff"

const TOKEN_KEY = "xuthi_auth_token"

// Pages that require authentication
const PROTECTED_PATHS = ["/profile", "/orders"]
const ADMIN_PATHS = ["/admin"]

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()
    const customerSyncInFlightRef = useRef<Record<string, Promise<void>>>({})
    const customerSyncRecentRef = useRef<Record<string, number>>({})

    // Load token from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem(TOKEN_KEY)
        if (savedToken) {
            setToken(savedToken)
        }
        setIsLoading(false)
    }, [])

    // Check URL for token (OAuth callback only)
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (!window.location.pathname.startsWith("/auth/callback")) {
                return
            }

            const params = new URLSearchParams(window.location.search)
            const urlToken = params.get("token")

            if (urlToken) {
                localStorage.setItem(TOKEN_KEY, urlToken)
                setToken(urlToken)
                // Clean URL
                window.history.replaceState({}, "", window.location.pathname)
            }
        }
    }, [])

    const syncCustomerProfile = useCallback(
        async (userData: User, authToken?: string | null) => {
            try {
                if (!userData?.id || !userData?.email) return

                const syncKey = `${userData.id}|${userData.email.toLowerCase()}`
                const now = Date.now()
                const recentAt = customerSyncRecentRef.current[syncKey]
                if (recentAt && now - recentAt < 10_000) {
                    return
                }

                const existingSync = customerSyncInFlightRef.current[syncKey]
                if (existingSync) {
                    await existingSync
                    return
                }

                const fullName = [userData.firstName, userData.lastName]
                    .filter(Boolean)
                    .join(" ")
                    .trim()

                const syncPromise = (async () => {
                    const response = await fetch(
                        `${API_URL}/api/customers/sync`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...(authToken
                                    ? { Authorization: `Bearer ${authToken}` }
                                    : {}),
                            },
                            body: JSON.stringify({
                                externalUserId: userData.id,
                                email: userData.email,
                                fullName: fullName || null,
                            }),
                        },
                    )

                    if (!response.ok) {
                        throw new Error("Customer sync failed")
                    }

                    customerSyncRecentRef.current[syncKey] = Date.now()
                })()

                customerSyncInFlightRef.current[syncKey] = syncPromise
                try {
                    await syncPromise
                } finally {
                    delete customerSyncInFlightRef.current[syncKey]
                }
            } catch (error) {
                console.warn("Failed to sync customer profile:", error)
            }
        },
        [],
    )

    const refreshUser = useCallback(async () => {
        const currentToken = token || localStorage.getItem(TOKEN_KEY)
        if (!currentToken) return

        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                },
            })

            if (response.ok) {
                const userData = await response.json()
                setUser(userData)

                // Sync customer profile for admin/customer management
                await syncCustomerProfile(userData, currentToken)
            } else if (response.status === 401) {
                // Token expired
                localStorage.removeItem(TOKEN_KEY)
                setToken(null)
                setUser(null)
            }
        } catch (error) {
            console.error("Failed to fetch user:", error)
        }
    }, [token, syncCustomerProfile])

    // Fetch user when token changes
    useEffect(() => {
        if (token) {
            refreshUser()
        } else {
            setUser(null)
        }
    }, [token, refreshUser])

    // Protect admin routes - redirect non-admin users
    useEffect(() => {
        if (isLoading) return

        const isAdminPath = ADMIN_PATHS.some((p) => pathname?.startsWith(p))
        const isProtectedPath = PROTECTED_PATHS.some((p) =>
            pathname?.startsWith(p),
        )

        if (isAdminPath) {
            if (!token && !localStorage.getItem(TOKEN_KEY)) {
                router.replace(
                    "/auth/login?redirect=" +
                        encodeURIComponent(pathname || "/admin"),
                )
                return
            }
            // If user loaded and not admin, redirect
            if (
                user &&
                !user.roles?.some(
                    (r) =>
                        r.toLowerCase() === "admin" ||
                        r.toLowerCase() === "staff",
                )
            ) {
                router.replace("/")
                return
            }
        } else if (
            isProtectedPath &&
            !token &&
            !localStorage.getItem(TOKEN_KEY)
        ) {
            router.replace(
                "/auth/login?redirect=" + encodeURIComponent(pathname || "/"),
            )
        }
    }, [isLoading, user, token, pathname, router])

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            })

            if (response.ok) {
                const data = await response.json()
                localStorage.setItem(TOKEN_KEY, data.token)
                setToken(data.token)
                const nextUser = {
                    id: data.userId,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    emailConfirmed: data.emailConfirmed,
                }
                setUser(nextUser)
                await syncCustomerProfile(nextUser, data.token)
                return { success: true, emailConfirmed: data.emailConfirmed }
            } else {
                const errorData = await response.json().catch(() => ({}))
                return {
                    success: false,
                    error: errorData.message || "Invalid credentials",
                }
            }
        } catch (error) {
            return { success: false, error: "Network error" }
        }
    }

    const register = async (
        email: string,
        password: string,
        firstName?: string,
        lastName?: string,
    ) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, firstName, lastName }),
            })

            if (response.ok) {
                const data = await response.json()
                localStorage.setItem(TOKEN_KEY, data.token)
                setToken(data.token)
                const nextUser = {
                    id: data.userId,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    emailConfirmed: data.emailConfirmed,
                }
                setUser(nextUser)
                await syncCustomerProfile(nextUser, data.token)
                return { success: true, emailConfirmed: data.emailConfirmed }
            } else {
                const errorData = await response.json().catch(() => ({}))
                return {
                    success: false,
                    error:
                        errorData.errors?.join(", ") || "Registration failed",
                }
            }
        } catch (error) {
            return { success: false, error: "Network error" }
        }
    }

    const loginWithGoogle = () => {
        const returnUrl = encodeURIComponent(
            window.location.origin + "/auth/callback",
        )
        window.location.href = `${API_URL}/api/auth/login-google?returnUrl=${returnUrl}`
    }

    const loginWithFacebook = () => {
        const returnUrl = encodeURIComponent(
            window.location.origin + "/auth/callback",
        )
        window.location.href = `${API_URL}/api/auth/login-facebook?returnUrl=${returnUrl}`
    }

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)

        // Redirect: if on protected/admin page, go to home
        const isProtected = PROTECTED_PATHS.some((p) => pathname?.startsWith(p))
        const isAdmin = ADMIN_PATHS.some((p) => pathname?.startsWith(p))

        if (isProtected || isAdmin) {
            router.push("/")
        } else {
            // On public pages, force a refresh to update UI
            router.refresh()
        }
    }

    const resendVerificationEmail = async (email: string) => {
        try {
            const response = await fetch(
                `${API_URL}/api/auth/resend-verification`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                },
            )

            if (response.ok) {
                return { success: true }
            } else {
                const errorData = await response.json().catch(() => ({}))
                return {
                    success: false,
                    error:
                        errorData.error || "Failed to send verification email",
                }
            }
        } catch (error) {
            return { success: false, error: "Network error" }
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                loginWithGoogle,
                loginWithFacebook,
                logout,
                refreshUser,
                resendVerificationEmail,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
