import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Protected routes - require authentication
  const protectedPaths = ['/dashboard', '/builder']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Auth routes - redirect to dashboard if already logged in
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // For auth pages, skip session refresh to avoid stale token errors
  // Let the client-side handle session cleanup
  if (isAuthPath) {
    return supabaseResponse
  }

  // For other pages, try to refresh session
  try {
    // This will refresh session if expired
    const { data: { user }, error } = await supabase.auth.getUser()

    // If there's an auth error, clear cookies and let user re-authenticate
    if (error) {
      console.log('Auth error in middleware:', error.message)

      // Clear all auth cookies
      const response = NextResponse.next({
        request,
      })

      // Remove auth cookies
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')

      // If trying to access protected route, redirect to login
      if (isProtectedPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }

      return response
    }

    if (isProtectedPath && !user) {
      // Redirect to login if trying to access protected route without auth
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

  } catch (err) {
    console.error('Middleware auth check failed:', err)

    // On any error, clear cookies and redirect if needed
    const response = NextResponse.next({
      request,
    })

    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    if (isProtectedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    return response
  }

  return supabaseResponse
}
