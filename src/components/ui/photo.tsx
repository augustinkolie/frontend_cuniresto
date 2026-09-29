'use client'

import Image, { type ImageLoader, type ImageProps } from 'next/image'

// Les photos Unsplash sont redimensionnées directement par leur CDN (plus fiable qu'un
// aller-retour par notre serveur sur une connexion lente) ; les autres images passent
// par l'optimiseur Next.js habituel.
const unsplashLoader: ImageLoader = ({ src, width, quality }) => {
  const url = new URL(src)
  url.searchParams.set('auto', 'format')
  url.searchParams.set('fit', 'crop')
  url.searchParams.set('w', String(width))
  url.searchParams.set('q', String(quality ?? 75))
  return url.toString()
}

/** Remplace next/image partout sur le site. */
export default function Photo(props: ImageProps) {
  const remote = typeof props.src === 'string' && props.src.startsWith('https://images.unsplash.com/')
  // eslint-disable-next-line jsx-a11y/alt-text -- alt transmis par l'appelant
  return <Image {...props} loader={remote ? unsplashLoader : props.loader} />
}
