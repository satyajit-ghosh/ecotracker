import { NextResponse } from 'next/server'

// Middleware function to protect certain routes
export function middleware(request) {
  // Read the 'accessToken' from cookies
  const token = request.cookies.get('accessToken')?.value

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Token exists, allow request to continue
  return NextResponse.next()
}

// Protect routes under /dashboard
export const config = {
  matcher: ['/dashboard/:path*'],
}
