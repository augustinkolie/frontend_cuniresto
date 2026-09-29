import type { NextConfig } from 'next'

const API_URL = process.env.API_URL ?? 'http://localhost:4100'

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Le badge de développement Next.js recouvrait le contenu en bas à gauche.
  devIndicators: false,
  reactStrictMode: true,
  // Le navigateur parle à l'API via le même domaine : cookies first-party, pas de CORS.
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${API_URL}/api/v1/:path*` },
      { source: '/uploads/:path*', destination: `${API_URL}/uploads/:path*` },
    ]
  },
  async redirects() {
    // Anciennes URL (site PHP et React) → nouvelles routes, pour conserver le référencement.
    return [
      { source: '/pratique.php', destination: '/', permanent: true },
      { source: '/produits.php', destination: '/carte', permanent: true },
      { source: '/categorie.php', destination: '/carte', permanent: true },
      { source: '/cat-lap.php', destination: '/carte?categorie=lapin', permanent: true },
      { source: '/cat-at.php', destination: '/carte?categorie=atieke', permanent: true },
      { source: '/cat-gn.php', destination: '/carte?categorie=spaghetti', permanent: true },
      { source: '/cat-san.php', destination: '/carte?categorie=sandwichs', permanent: true },
      { source: '/detail:rest(.*).php', destination: '/carte', permanent: true },
      { source: '/panier.php', destination: '/panier', permanent: true },
      { source: '/reservation.php', destination: '/reserver', permanent: true },
      { source: '/connexion.php', destination: '/connexion', permanent: true },
      { source: '/commentaire.php', destination: '/carte', permanent: true },
      { source: '/menu', destination: '/carte', permanent: true },
      { source: '/products', destination: '/carte', permanent: true },
      { source: '/categories', destination: '/carte', permanent: true },
      { source: '/category/:slug', destination: '/carte?categorie=:slug', permanent: true },
      { source: '/cart', destination: '/panier', permanent: true },
      { source: '/register', destination: '/inscription', permanent: true },
      { source: '/reservation', destination: '/reserver', permanent: true },
      { source: '/about', destination: '/a-propos', permanent: true },
      { source: '/login', destination: '/connexion', permanent: true },
      { source: '/profile', destination: '/compte', permanent: true },
      { source: '/loyalty', destination: '/compte/fidelite', permanent: true },
      { source: '/corporate', destination: '/entreprises', permanent: true },
      { source: '/academy', destination: '/academie', permanent: true },
      { source: '/resources', destination: '/academie/ressources', permanent: true },
      { source: '/studio', destination: '/academie/direct', permanent: true },
      { source: '/help-center', destination: '/aide', permanent: true },
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/terms-and-privacy', destination: '/conditions', permanent: true },
      { source: '/order/:id/tracking', destination: '/commande/:id', permanent: true },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4100', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Photos réelles (non générées) hébergées sur Unsplash, licence libre.
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
}

export default config
