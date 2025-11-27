'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, LogIn, RefreshCw } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Clear any stale sessions on page load
  useEffect(() => {
    const clearStaleSession = async () => {
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } catch (err) {
        console.log('Cleaned up stale session')
      }
    }
    clearStaleSession()
  }, [])

  const handleClearSession = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      setError('')
      alert('Session cleared. Please try logging in again.')
    } catch (err) {
      console.error('Error clearing session:', err)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before logging in.')
        } else {
          setError(error.message || 'Login failed. Please try again.')
        }
        setLoading(false)
        return
      }

      if (data.user && data.session) {
        window.location.href = '/dashboard'
      } else {
        setError('Login failed. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)

      if (err.message?.includes('Failed to fetch') || err.message?.includes('fetch')) {
        setError('Cannot connect to authentication service. Please check your internet connection.')
      } else if (err.message?.includes('503') || err.code === 503 || err.message?.includes('refresh_token')) {
        setError('Authentication service error. Click "Clear session & retry" below to fix this issue.')
      } else if (err.message?.includes('500') || err.code === 500) {
        setError('Server error. Please try again in a few moments.')
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">CDI</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CDI Test Builder</h1>
          <p className="text-gray-500">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-12 py-3 border border-gray-300 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Forgot Password */}
        <div className="mt-4 text-center">
          <a href="#" className="text-gray-500 text-sm hover:text-blue-600 transition-colors">
            Forgot your password?
          </a>
        </div>

        {/* Clear Session Button */}
        <div className="mt-4 text-center">
          <button
            onClick={handleClearSession}
            className="text-gray-400 text-xs hover:text-blue-600 transition-colors flex items-center justify-center gap-1 mx-auto"
            type="button"
          >
            <RefreshCw size={12} />
            <span>Having login issues? Clear session & retry</span>
          </button>
        </div>
      </div>
    </div>
  )
}
