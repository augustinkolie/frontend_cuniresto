// Photos réelles (prises par des photographes, non générées), hébergées sur Unsplash (licence libre).
// Pour les remplacer par vos propres photos, changez uniquement ce fichier.

const unsplash = (id: string, width = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`

export const PHOTOS = {
  heroDish: { src: unsplash('1596797038530-2c107229654b'), alt: 'Viande mijotée dans sa sauce tomate épicée, parsemée d’herbes fraîches' },
  embers: { src: unsplash('1765036741158-5a1698974257', 600), alt: 'Viande marinée qui grille au-dessus des braises' },
  chef: { src: unsplash('1694821144277-7d9d5e0b0522', 1000), alt: 'Notre chef en veste noire et toque, les mains dans la farine' },
  brigade: { src: unsplash('1565608087341-404b25492fee', 1200), alt: 'Une cuisinière de la brigade au passe, ses collègues en cuisine derrière elle' },
  riceDish: { src: unsplash('1665332195309-9d75071138f0', 800), alt: 'Riz au gras, poisson grillé et brochettes' },
  cassava: { src: unsplash('1757283961570-682154747d9c'), alt: 'Racines de manioc fraîches, la base de l’atiéké' },
} as const
