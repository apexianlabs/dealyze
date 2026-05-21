import { NextResponse } from 'next/server'

export function middleware(request) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  if (hostname === 'app.dealyze.app') {
    if (pathname === '/') {
      const token = request.cookies.get('dea_token')?.value
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
    return NextResponse.next()
  }

  if (hostname === 'dealyze.app' || hostname === 'www.dealyze.app') {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/billing') ||
        pathname.startsWith('/generate') || pathname.startsWith('/login') ||
        pathname.startsWith('/signup')) {
      return NextResponse.redirect(new URL('https://app.dealyze.app' + pathname, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
