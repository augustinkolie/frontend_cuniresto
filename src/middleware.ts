import { type NextRequest, NextResponse } from 'next/server'

// Protège l'espace client, la messagerie, l'administration et l'espace livreur.
// Le contrôle des rôles est fait par l'API (source de vérité) et rappelé par les layouts.
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('mb_access') || request.cookies.has('mb_refresh')
  if (hasSession) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = '/connexion'
  url.search = `?suite=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/compte/:path*', '/messages/:path*', '/admin/:path*', '/livreur/:path*'],
}
