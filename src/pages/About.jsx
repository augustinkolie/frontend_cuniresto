import React, { useEffect, useState } from 'react'
import { Utensils, Award, Users, Heart, Sparkles, ChefHat, Globe, Clock, Quote, Crown, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'

export default function About() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        window.scrollTo(0, 0)
    }, [])

    const stats = [
        { label: 'Ans d\'Excellence', value: '12', icon: <Award className="text-primary" size={24} /> },
        { label: 'Chefs Passionnés', value: '8', icon: <ChefHat className="text-secondary" size={24} /> },
        { label: 'Clients Heureux', value: '50k+', icon: <Users className="text-accent" size={24} /> },
        { label: 'Plats Uniques', value: '120+', icon: <Utensils className="text-primary" size={24} /> },
    ]

    const values = [
        {
            title: 'Qualité Sans Compromis',
            description: 'Nous sélectionnons rigoureusement chaque ingrédient auprès des meilleurs producteurs locaux de Guinée.',
            icon: <Heart className="text-red-500" />
        },
        {
            title: 'Innovation Culinaire',
            description: 'Nos chefs réinventent les classiques africains avec des techniques modernes et une présentation artistique.',
            icon: <Sparkles className="text-yellow-500" />
        },
        {
            title: 'Esprit de Communauté',
            description: 'CuniResto est plus qu\'un restaurant; c\'est un lieu de rencontre où la culture et la gastronomie se rejoignent.',
            icon: <Globe className="text-blue-500" />
        }
    ]

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-500">
            <SEOHead
                title="À Propos de CuniResto - Excellence Culinaire Africaine"
                description="Découvrez l'histoire de CuniResto, notre passion pour la gastronomie africaine et notre engagement envers l'excellence."
            />

            {/* Hero Section - Redesigned to match Menu page style */}
            <div className="relative text-white py-12 md:py-16 overflow-hidden">
                {/* Background Image with Blur */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: "url('/images/about/exterior.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(2px)'
                    }}
                ></div>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/40 z-0"></div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 z-0">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}></div>
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className={`inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl mb-4 transform transition-all duration-1000 ease-out ${mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'}`}>
                            <Users size={28} className="text-white" />
                        </div>
                        <h1 className={`text-3xl md:text-4xl font-bold mb-4 transform transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                            À Propos de Nous
                        </h1>
                        <p className={`text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed transform transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '200ms' }}>
                            Découvrez l'histoire de CuniResto, notre passion pour la gastronomie africaine et notre engagement envers l'excellence.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Section - Refined: horizontal layout & compact cards */}
            <section className="bg-white dark:bg-gray-950 py-10 -mt-6 relative z-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-row items-center justify-between gap-4">
                                <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-full flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    {React.cloneElement(stat.icon, { size: 22 })}
                                </div>
                                <div className="flex-1 text-center">
                                    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        {stat.label}
                                    </div>
                                </div>
                                <div className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight text-right">
                                    {stat.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className={`space-y-6 transition-all duration-1000 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
                        <span className="text-primary font-bold tracking-widest uppercase text-sm">Notre Histoire</span>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                            Une Passion Née du Terroir Guinéen
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                            Fondé avec la vision de placer la cuisine africaine sur la carte mondiale de la haute gastronomie, CuniResto célèbre l'héritage riche et diversifié du continent.
                            Chaque plat que nous servons raconte une histoire — celle des mains qui cultivent la terre, des épices qui voyagent à travers les âges et de l'innovation qui nous pousse vers l'avenir.
                        </p>
                        <div className="bg-primary/5 border-l-4 border-primary p-6 italic text-gray-700 dark:text-gray-300 rounded-r-xl">
                            <Quote className="text-primary/20 mb-2" size={32} />
                            "Nous ne servons pas seulement de la nourriture, nous partageons une part de notre âme et de notre culture avec chaque client."
                            <p className="mt-2 font-bold not-italic">— Fondateur de CuniResto</p>
                        </div>
                    </div>
                    <div className={`relative transition-all duration-1000 delay-300 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
                        <div className="aspect-square rounded-full overflow-hidden">
                            <img
                                src="/images/about/rabbit_riz_au_gras.png"
                                alt="Riz au gras avec viande de lapin"
                                className="w-full h-full object-contain drop-shadow-2xl animate-[spin_40s_linear_infinite]"
                            />
                        </div>
                    </div>
                </div>
            </section>


            {/* The Chef Section */}
            <section className="py-24 px-4 bg-white dark:bg-gray-950 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2 relative">
                            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                                <img
                                    src="/images/about/chef.png"
                                    alt="Our Executive Chef"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl"></div>
                        </div>
                        <div className="lg:w-1/2 space-y-8">
                            <div className="space-y-4">
                                <span className="text-accent font-bold tracking-widest uppercase text-sm italic">Maîtrise Culinaire</span>
                                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Le Chef de l'Excellence</h2>
                                <p className="text-gray-600 dark:text-gray-400 text-lg">
                                    Notre chef exécutif fusionne l'authenticité des recettes transmises de génération en génération avec une rigueur technique digne des plus grandes tables étoilées.
                                    Pour lui, cuisiner est un acte d'amour et de précision, où chaque détail compte pour sublimer les saveurs de notre continent.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Award className="text-primary" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold dark:text-white">Récompensé</h4>
                                        <p className="text-sm text-gray-500">Meilleure innovation gastronomique 2024.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                        <Sparkles className="text-accent" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold dark:text-white">Créatif</h4>
                                        <p className="text-sm text-gray-500">Un menu qui évolue au fil des saisons.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-24 px-4 bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <img
                        src="/images/about/team.png"
                        alt="Kitchen Background"
                        className="w-full h-full object-cover filter blur-sm"
                    />
                </div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold text-white mb-6">Une Équipe, Une Vision</h2>
                        <p className="text-gray-400 text-lg">
                            Derrière chaque plat se cache une équipe dévouée d'artisans culinaires qui travaillent en harmonie pour transformer des ingrédients bruts en chefs-d'œuvre gastronomiques.
                        </p>
                    </div>
                    <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                        <img
                            src="/images/about/team.png"
                            alt="Our Kitchen Team"
                            className="w-full h-auto"
                        />
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Nos Valeurs Fondamentales</h2>
                    <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {values.map((val, idx) => (
                        <div key={idx} className="group p-10 rounded-[2rem] bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 text-center">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-8 transform group-hover:rotate-12 transition-transform duration-500">
                                <div className="scale-150">{val.icon}</div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{val.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{val.description}</p>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    )
}
