import { NextResponse, type NextRequest } from 'next/server'

function isValidBasicAuth(authHeader: string): boolean {
  try {
    const [scheme, credentials] = authHeader.split(' ')
    if (scheme !== 'Basic') return false

    const decodedCredentials = atob(credentials)
    const [username, password] = decodedCredentials.split(':')

    return username === process.env.ADMIN_USERNAME && 
           password === process.env.ADMIN_PASSWORD
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  // Only protect the admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !isValidBasicAuth(authHeader)) {
      return new NextResponse(null, {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
} 