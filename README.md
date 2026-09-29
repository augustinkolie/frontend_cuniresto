Cahier des charges — Refonte du site Restaurant (Next.js + NestJS)
28 sept. 2026 · @KOLIE
1. Contexte, objectifs et périmètre
La refonte remplace intégralement l'existant PHP par un frontend Next.js et une API NestJS, en conservant 100 % des fonctionnalités actuelles. Le design générique est abandonné au profit d'une identité visuelle propre au restaurant.
1.1 Constat sur l'existant
• Design générique (template), sans identité de marque.
• Fichiers PHP mélangés dans le front et le back : logique métier, SQL et affichage couplés.
• Performances et référencement limités par un rendu serveur non optimisé.
• Code difficile à tester et à faire évoluer.
1.2 Objectifs mesurables
Objectif
Indicateur
Cible
Performance
Score Lighthouse Performance (mobile)
≥ 95
Chargement
Largest Contentful Paint (4G)
< 2,0 s
Interactivité
Interaction to Next Paint
< 200 ms
Stabilité visuelle
Cumulative Layout Shift
< 0,05
Poids
JavaScript initial par page
< 150 Ko gzip
API
Temps de réponse p95 des lectures
< 150 ms
Qualité
Couverture de tests du backend (services)
≥ 80 %
Référencement
Score Lighthouse SEO
100
Accessibilité
Conformité WCAG
2.1 AA
1.3 Périmètre
• Inclus : réécriture complète du site public, de l'espace client et de l'espace d'administration ; nouvelle API ; migration des données existantes ; nouvelle identité visuelle.
• Exclu : application mobile native, caisse enregistreuse physique (intégration possible en phase ultérieure).
• Règle absolue : aucun fichier .php ne subsiste dans le dépôt à la livraison. Une vérification automatique en CI bloque toute fusion contenant du PHP.
1.4 Stack cible
Couche
Technologie
Frontend
Next.js 15 (App Router), React Server Components, TypeScript strict
Style
Tailwind CSS 4 + design tokens, Framer Motion (animations légères)
Backend
NestJS 11, TypeScript strict
Base de données
PostgreSQL 16 + Prisma ORM
Cache et files
Redis (cache, sessions, BullMQ pour les tâches asynchrones)
Médias
Stockage objet compatible S3 + optimisation next/image
Paiement
Stripe et/ou Mobile Money (Orange Money, MTN) selon le marché
Temps réel
WebSocket (Socket.IO via @nestjs/websockets) pour le suivi des commandes
Monorepo
pnpm workspaces + Turborepo
2. Fonctionnalités existantes à conserver
Toutes les fonctionnalités ci-dessous sont reprises à l'identique côté métier, puis améliorées côté expérience. Cet inventaire est une base standard pour un site de restaurant : il doit être validé ligne par ligne contre le code PHP actuel avant le démarrage.
2.1 Site public
Fonctionnalité
Comportement attendu dans la nouvelle version
Module backend
Page d'accueil
Hero plein écran, plats signatures, horaires, appel à réserver
content
Menu / carte
Catégories, filtres (végétarien, épicé, allergènes), recherche instantanée
menu
Fiche plat
Photo, description, prix, options (taille, suppléments), allergènes
menu
Réservation de table
Choix date, heure, nombre de couverts ; disponibilité en temps réel ; confirmation e-mail/SMS
reservations
Commande en ligne
Panier persistant, à emporter ou livraison, créneau de retrait
orders
Paiement
Paiement en ligne ou sur place, reçu automatique
payments
Galerie
Photos de la salle et des plats, chargement progressif
media
Avis clients
Note et commentaire après commande, modération
reviews
À propos / équipe
Histoire, chef, valeurs
content
Contact
Formulaire, carte, horaires, téléphone cliquable
contact
Newsletter
Inscription avec double confirmation
notifications
2.2 Espace client
Fonctionnalité
Comportement attendu
Module backend
Inscription / connexion
E-mail + mot de passe, option connexion Google
auth, users
Profil
Coordonnées, adresses de livraison enregistrées
users
Historique
Commandes et réservations passées, recommander en un clic
orders, reservations
Suivi de commande
Statut en temps réel (reçue, en préparation, prête, livrée)
orders (WebSocket)
2.3 Espace d'administration
Fonctionnalité
Comportement attendu
Module backend
Tableau de bord
Chiffre d'affaires du jour, commandes en cours, réservations à venir
analytics
Gestion du menu
CRUD catégories et plats, disponibilité on/off, upload photos
menu, media
Gestion des commandes
Vue cuisine type Kanban, changement de statut, impression ticket
orders
Gestion des réservations
Planning, plan de salle, capacité par créneau
reservations
Gestion des utilisateurs
Rôles (admin, manager, cuisine, serveur), désactivation
users, auth
Contenus
Textes, horaires, jours de fermeture, galerie
content, media
Avis
Modération, réponse du restaurant
reviews
Paramètres
Frais de livraison, zones, taxes, moyens de paiement
settings
2.4 Traçabilité de la migration
Chaque fichier PHP existant est listé dans une matrice de correspondance (fichier PHP → route Next.js ou endpoint NestJS). Un fichier n'est supprimé qu'une fois sa fonctionnalité reproduite et testée.
3. Identité visuelle
La direction artistique « Braise & Nuit » associe un fond sombre charbon, des accents chauds de braise et de safran, et une typographie éditoriale. Elle évoque la cuisine au feu, le dîner du soir et le haut de gamme accessible, loin des templates génériques.
3.1 Principes de design
• La photo est la star : grandes images de plats, recadrages serrés, peu d'icônes décoratives.
• Contraste éditorial : titres serif de grande taille, texte courant sans-serif sobre, beaucoup d'espace.
• Une seule action forte par écran : un bouton braise (Réserver ou Commander), le reste en boutons secondaires.
• Mouvement discret : apparitions au défilement de 200 à 300 ms, aucune animation qui retarde l'affichage du contenu ; respect de prefers-reduced-motion.
• Thème : site public en mode sombre par défaut (ambiance soirée), administration en mode clair pour la lisibilité en cuisine et au comptoir.
3.2 Palette de couleurs
Token
Nom
Hex
Usage
--color-bg
Charbon
#14110F
Fond principal du site public
--color-surface
Ardoise
#24201D
Cartes, menus déroulants, modales
--color-primary
Braise
#F06A3F
Boutons d'action principaux, liens actifs, prix mis en avant
--color-accent
Safran
#F2A541
Étoiles d'avis, badges « Signature », détails fins
--color-text
Crème
#F7F1E8
Texte principal sur fond sombre ; fond du mode clair
--color-muted
Pierre
#A89F94
Texte secondaire, descriptions, légendes
--color-success
Sauge
#7A9E7E
Plats végétariens, statut « Prête », confirmations
--color-danger
Piment
#D64545
Erreurs, allergènes, annulations
Règles de contraste (WCAG AA) : texte des boutons braise en Charbon (#14110F, ratio ≈ 6:1) et non en blanc ; Pierre sur Charbon ≈ 7:1. Les couleurs sont définies une seule fois comme tokens CSS et consommées par Tailwind (@theme).
3.3 Typographie
Rôle
Police
Graisse
Taille (mobile → desktop)
Titres d'affiche (H1)
Fraunces (serif)
600
40 → 72 px
Titres de section (H2, H3)
Fraunces
500
28 → 44 px / 22 → 28 px
Texte courant
Manrope (sans-serif)
400 / 500
16 → 18 px, interligne 1,6
Prix, labels, boutons
Manrope
600
14 → 16 px, chiffres tabulaires
Les polices sont auto-hébergées via next/font (sous-ensemble latin, display: swap) : aucune requête vers Google au chargement et aucun décalage de mise en page.
3.4 Composants UI clés
• Boutons : primaire (fond Braise, texte Charbon), secondaire (contour Crème), fantôme (texte seul) ; hauteur 48 px, coins arrondis 12 px.
• Carte plat : photo 4:3, nom en Fraunces, description sur 2 lignes, prix en Braise, pastilles régime (Sauge) et allergènes (Piment), bouton « Ajouter ».
• Barre de catégories : collante en haut de la carte, défilement horizontal sur mobile, catégorie active soulignée en Braise.
• Panier : tiroir latéral sur desktop, feuille inférieure sur mobile, total toujours visible.
• Widget de réservation : calendrier, créneaux en pastilles cliquables (complet = grisé), nombre de couverts en compteur.
• Suivi de commande : frise de 4 étapes, étape en cours en Safran animée.
• Admin cuisine : colonnes Kanban (Reçue, En préparation, Prête, Remise), cartes grand format lisibles à 2 m.
3.5 Structure de la page d'accueil
1. En-tête transparent : logo, navigation (Carte, Réserver, À propos, Contact), bouton « Commander ».
2. Hero plein écran : photo ou courte vidéo muette du plat phare, titre Fraunces, deux boutons (Réserver, Voir la carte).
3. Plats signatures : 3 à 6 cartes en carrousel.
4. Histoire du chef : photo + texte en deux colonnes.
5. Avis clients : note moyenne et 3 avis récents.
6. Bandeau réservation : horaires du jour et widget de réservation rapide.
7. Pied de page : adresse, carte, réseaux sociaux, newsletter.
Les maquettes haute fidélité (mobile 375 px et desktop 1440 px) sont produites et validées avant tout développement d'écran.
4. Frontend Next.js et performance
Le frontend rend côté serveur tout ce qui est public et statique, et ne charge du JavaScript client que pour les parties interactives (panier, réservation, suivi). C'est ce qui permet d'atteindre un score Lighthouse ≥ 95 sur mobile.
4.1 Stratégie de rendu par page
Page
Rendu
Revalidation
Accueil, À propos, Contact
Statique (SSG)
À la demande quand l'admin modifie le contenu
Carte / menu
Statique + ISR
À la demande (revalidateTag('menu')) après chaque modification
Fiche plat
Statique par plat (generateStaticParams)
Tag dish:{id}
Réservation
Server Component + îlot client pour les créneaux
Disponibilités en direct, sans cache
Panier, paiement
Client Component
—
Espace client
SSR dynamique (session)
—
Administration
SSR + client, route protégée par middleware
—
4.2 Organisation du code
apps/web/
  app/
    (public)/            # accueil, carte, réservation, contact
    (account)/           # espace client (connecté)
    admin/               # back-office (rôles admin, manager, cuisine)
    api/revalidate/      # webhook appelé par NestJS pour vider le cache
  features/              # un dossier par domaine : menu, cart, booking, orders
    menu/components  menu/hooks  menu/api
  components/ui/         # boutons, cartes, modales (design system)
  lib/                   # client API généré, auth, utilitaires
packages/
  ui/                    # design system partagé (tokens + composants)
  api-client/            # client TypeScript généré depuis l'OpenAPI NestJS
  config/                # ESLint, TypeScript, Tailwind partagés
4.3 Choix techniques
• Données côté serveur : fetch dans les Server Components avec tags de cache ; aucun appel API au montage côté client pour le contenu public.
• Données côté client : TanStack Query pour l'espace client et l'admin (cache, rafraîchissement, mises à jour optimistes).
• État du panier : Zustand, persisté localement puis synchronisé avec le serveur à la connexion.
• Formulaires : React Hook Form + Zod ; les schémas Zod sont partagés avec le client API pour une validation identique des deux côtés.
• Typage de bout en bout : le client API est généré depuis la spécification OpenAPI de NestJS ; un changement d'API casse la compilation du front au lieu de casser la production.
• Authentification : cookies httpOnly posés par l'API ; le middleware Next.js protège /admin et /(account).
4.4 Exigences de performance
• Images : next/image en AVIF/WebP, tailles adaptées, priority uniquement sur l'image du hero, placeholders flous.
• Polices : next/font, 2 familles maximum, sous-ensembles.
• JavaScript : écrans lourds (admin, carte interactive) chargés en dynamic() ; bibliothèques d'animation limitées aux composants client qui en ont besoin.
• Aucun script tiers bloquant ; analytics chargés après interaction (next/script stratégie lazyOnload).
• Budget vérifié en CI : Lighthouse CI échoue si Performance < 95 ou si le JS initial dépasse 150 Ko gzip.
• SEO : métadonnées par page (generateMetadata), sitemap et robots générés, données structurées Schema.org Restaurant et Menu, images Open Graph générées.
• Accessibilité : navigation clavier complète, focus visible en Safran, textes alternatifs obligatoires sur les photos de plats (champ requis dans l'admin).
5. Backend NestJS
Le backend est un monolithe modulaire : un module NestJS par domaine métier, chacun découpé en quatre couches (présentation, application, domaine, infrastructure). Les dépendances pointent toujours vers le domaine, jamais l'inverse.
Le domaine ne dépend de rien : l'infrastructure implémente les ports définis par l'application, ce qui permet de changer de base de données ou de fournisseur de paiement sans toucher aux règles métier.
5.1 Couches d'un module
Couche
Contenu
Règle
Présentation
Controllers REST, gateways WebSocket, DTO d'entrée/sortie, guards
Ne contient aucune règle métier ; appelle un cas d'usage
Application
Cas d'usage (PlaceOrderUseCase, CancelReservationUseCase), ports (interfaces)
Orchestration ; dépend uniquement d'interfaces
Domaine
Entités, objets-valeurs (Money, TimeSlot), règles, événements (OrderPlaced)
TypeScript pur, aucune dépendance à NestJS ni à Prisma
Infrastructure
Repositories Prisma, adaptateurs paiement, e-mail, SMS, stockage
Implémente les ports ; seul endroit qui connaît les outils externes
apps/api/src/
  modules/
    orders/
      presentation/   orders.controller.ts  orders.gateway.ts  dto/
      application/    use-cases/  ports/order.repository.ts
      domain/         order.entity.ts  order-status.ts  events/
      infrastructure/ prisma-order.repository.ts
      orders.module.ts
    menu/  reservations/  payments/  users/  auth/
    reviews/  content/  media/  notifications/  analytics/  settings/
  shared/             # Money, pagination, erreurs de domaine, bus d'événements
  infrastructure/     # PrismaService, Redis, config, logger
  main.ts
5.2 Application des principes SOLID
Principe
Application concrète dans le projet
S — Responsabilité unique
Un cas d'usage = une classe = une action (PlaceOrderUseCase). Le controller ne fait que valider et déléguer ; le calcul du total vit dans l'entité Order.
O — Ouvert/fermé
Moyens de paiement en stratégies (StripeGateway, OrangeMoneyGateway, CashGateway) derrière PaymentGateway. Ajouter MTN Money = ajouter une classe, sans toucher au code existant. Idem pour les canaux de notification (e-mail, SMS, WhatsApp).
L — Substitution de Liskov
Toute implémentation d'un port respecte le même contrat, vérifié par une suite de tests partagée exécutée sur chaque implémentation (Prisma et en mémoire).
I — Ségrégation des interfaces
Ports fins : OrderReader et OrderWriter séparés ; le module analytics ne dépend que de OrderReader.
D — Inversion des dépendances
Les cas d'usage reçoivent des interfaces via des jetons d'injection ; le module lie l'implémentation ({ provide: ORDER_REPOSITORY, useClass: PrismaOrderRepository }). Les tests injectent une version en mémoire.
Exemple de référence, à suivre dans tous les modules :
// application/ports/order.repository.ts
export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
}

// application/use-cases/place-order.use-case.ts
@Injectable()
export class PlaceOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(MENU_READER) private readonly menu: MenuReader,
    private readonly events: EventBus,
  ) {}

  async execute(cmd: PlaceOrderCommand): Promise<OrderId> {
    const dishes = await this.menu.findAvailable(cmd.items.map(i => i.dishId));
    const order = Order.place(cmd.customerId, cmd.items, dishes); // règles dans le domaine
    await this.orders.save(order);
    await this.events.publish(order.pullEvents()); // OrderPlaced → notifications, cuisine
    return order.id;
  }
}
5.3 Communication entre modules
• Un module n'importe jamais le repository d'un autre module ; il passe par un port public exporté (MenuReader) ou par un événement de domaine.
• Événements : OrderPlaced, OrderStatusChanged, ReservationConfirmed, PaymentSucceeded, MenuUpdated. Les effets de bord (e-mails, SMS, invalidation du cache Next.js, mise à jour du tableau de bord) sont traités par des abonnés via BullMQ, avec relance automatique en cas d'échec.
• Une règle ESLint (eslint-plugin-boundaries) bloque les imports interdits entre couches et entre modules.
5.4 Modèle de données (PostgreSQL + Prisma)
Entité
Champs principaux
Relations
User
id, email, passwordHash, name, phone, role, isActive
1-n Order, Reservation, Review, Address
Category
id, name, slug, position, isVisible
1-n Dish
Dish
id, name, slug, description, priceCents, imageUrl, imageAlt, isAvailable, tags, allergens
n-1 Category ; 1-n DishOption
DishOption
id, name, extraPriceCents
n-1 Dish
Order
id, number, type (pickup/delivery/dine_in), status, subtotalCents, deliveryFeeCents, totalCents, scheduledAt
n-1 User ; 1-n OrderItem ; 1-1 Payment
OrderItem
id, dishId, nameSnapshot, unitPriceCents, quantity, options
n-1 Order
Payment
id, provider, providerRef, amountCents, status
1-1 Order
Reservation
id, date, timeSlot, partySize, status, notes, tableId
n-1 User ; n-1 Table
Table
id, label, capacity, zone
1-n Reservation
Review
id, rating, comment, status, reply
n-1 User ; n-1 Order
OpeningHours / Closure
jour, ouverture, fermeture / date, motif
—
Setting
key, value (JSON)
—
Règles : montants stockés en entiers (centimes ou unité monétaire entière pour le GNF), jamais en flottants ; nom et prix du plat copiés dans OrderItem pour que l'historique ne change pas si la carte change ; suppression logique (deletedAt) pour les plats et utilisateurs ; index sur Order(status, createdAt) et Reservation(date, timeSlot).
5.5 Cycle de vie d'une commande
Les transitions autorisées sont codées dans l'entité Order ; toute transition interdite lève une erreur de domaine (HTTP 409).
1. PENDING_PAYMENT → CONFIRMED (paiement réussi ou paiement sur place) ou CANCELLED
2. CONFIRMED → PREPARING → READY
3. READY → OUT_FOR_DELIVERY → DELIVERED (livraison) ou READY → COMPLETED (retrait, sur place)
4. Chaque transition émet OrderStatusChanged, diffusé en WebSocket au client et à l'écran cuisine.
5.6 API REST
Préfixe /api/v1, documentation OpenAPI générée automatiquement (/api/docs), réponses d'erreur au format RFC 9457 (Problem Details), pagination par curseur.
Ressource
Endpoints principaux
Accès
Auth
POST /auth/register, /auth/login, /auth/refresh, /auth/logout
Public
Menu
GET /categories, GET /dishes, GET /dishes/:slug ; POST/PATCH/DELETE /admin/dishes
Public / Manager
Réservations
GET /reservations/availability, POST /reservations, PATCH /reservations/:id/cancel
Client / Staff
Commandes
POST /orders, GET /orders/me, GET /orders/:id, PATCH /admin/orders/:id/status
Client / Cuisine
Paiements
POST /payments/intent, POST /payments/webhooks/:provider
Client / Fournisseur (signature vérifiée)
Avis
POST /reviews, GET /reviews, PATCH /admin/reviews/:id
Client / Manager
Contenus
GET /content/:key, PUT /admin/content/:key, GET /opening-hours
Public / Admin
Médias
POST /admin/media (upload signé vers S3)
Manager
Tableau de bord
GET /admin/analytics/summary
Admin, Manager
5.7 Rôles et permissions
Rôle
Droits
Admin
Tout, y compris utilisateurs et paramètres
Manager
Menu, contenus, avis, réservations, commandes, tableau de bord
Cuisine
Lecture des commandes, changement de statut jusqu'à READY
Serveur
Réservations du jour, plan de salle, commandes sur place
Client
Ses propres commandes, réservations, avis et profil
Les permissions sont déclarées par décorateur (@Roles('manager')) et vérifiées par un RolesGuard global ; l'accès aux ressources d'un client est vérifié dans le cas d'usage (propriétaire de la commande).
6. Sécurité, qualité, migration et planning
La livraison se fait en 5 phases sur environ 12 semaines, avec l'ancien site maintenu en ligne jusqu'à la bascule finale. Aucune phase n'est close sans tests verts et vérification des performances.
Critères de passage : maquettes validées en fin de semaine 2, parité fonctionnelle avec l'ancien site en fin de semaine 10, zéro fichier PHP et Lighthouse ≥ 95 avant la mise en ligne.
6.1 Sécurité
• Mots de passe hachés en Argon2id ; jeton d'accès JWT de 15 minutes et jeton de rafraîchissement en rotation, tous deux en cookies httpOnly, Secure, SameSite=Lax.
• Validation stricte de toutes les entrées (ValidationPipe avec whitelist et forbidNonWhitelisted) ; requêtes exclusivement via Prisma (aucun SQL construit à la main).
• Limitation de débit (@nestjs/throttler + Redis) sur la connexion, la réservation et le contact ; Helmet ; CORS limité au domaine du front.
• Webhooks de paiement vérifiés par signature et idempotents (clé d'idempotence stockée).
• Uploads : URL signées, types MIME et taille contrôlés, images réencodées.
• Secrets uniquement en variables d'environnement validées au démarrage (schéma Zod) ; aucun secret dans le dépôt.
6.2 Qualité et tests
Niveau
Outil
Cible
Unitaires domaine et cas d'usage
Jest, repositories en mémoire
≥ 80 % de couverture
Intégration repositories
Jest + Testcontainers (PostgreSQL réel)
Chaque repository
API de bout en bout
Supertest
Chaque endpoint, cas nominal et erreurs
Parcours utilisateur
Playwright
Réserver, commander, payer, suivre, gérer le menu
Performance front
Lighthouse CI
Performance ≥ 95, SEO 100, Accessibilité ≥ 95
Style et architecture
ESLint, Prettier, eslint-plugin-boundaries, TypeScript strict
Zéro erreur
6.3 DevOps et exploitation
• Monorepo pnpm + Turborepo ; conventions de commit (Conventional Commits) et revue obligatoire avant fusion.
• CI GitHub Actions : lint, typecheck, tests, build, Lighthouse CI, et contrôle « zéro fichier PHP » (find . -name "*.php" doit être vide).
• Conteneurs Docker pour l'API ; front déployé sur Vercel ou en mode standalone sur le même serveur ; environnements dev, staging, production.
• Observabilité : logs structurés (Pino), suivi d'erreurs (Sentry), endpoint de santé (@nestjs/terminus), sauvegarde quotidienne de la base.
6.4 Migration des données
1. Export de la base actuelle (probablement MySQL) et cartographie table par table vers le schéma Prisma.
2. Script de migration TypeScript idempotent : conversion des prix en entiers, normalisation des statuts, copie des images vers le stockage objet.
3. Mots de passe : si l'ancien hachage est compatible (bcrypt), il est conservé et remplacé par Argon2id à la prochaine connexion ; sinon, e-mail de réinitialisation à tous les clients.
4. Répétition complète sur staging, contrôle des totaux (nombre de clients, commandes, chiffre d'affaires), puis migration finale lors de la bascule.
5. Redirections 301 des anciennes URL .php vers les nouvelles routes pour conserver le référencement.
6.5 Livrables
• Maquettes haute fidélité et design system documenté.
• Code source du monorepo (front, API, packages partagés) sans aucun fichier PHP.
• Documentation OpenAPI, README d'installation, guide d'architecture et décisions techniques (ADR).
• Scripts de migration et rapport de contrôle des données.
• Pipeline CI/CD opérationnel et environnement de production déployé.
6.6 Questions ouvertes
• Liste exacte des fonctionnalités présentes dans le code PHP actuel (à confronter à la section 2).
• Moyens de paiement à retenir (Stripe, Orange Money, MTN Mobile Money, paiement sur place).
• Devise de référence et zones de livraison.
• Hébergement cible et budget d'infrastructure.
• Nom, logo et photos du restaurant disponibles ou à produire.
