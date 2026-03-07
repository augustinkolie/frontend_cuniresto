import React, { useState } from 'react'
import { Play, MessageCircle, Users, Heart, Share2, Settings, ChevronRight, Video, Mic, Smartphone, BookOpen, Clock, CheckCircle, Send } from 'lucide-react'
import { useLocation, Navigate } from 'react-router-dom'

export default function Studio() {
    const location = useLocation()
    const { course } = location.state || {}
    const [activeTab, setActiveTab] = useState('modules') // 'modules' or 'live'
    const [currentModule, setCurrentModule] = useState(0)
    const [chatMessage, setChatMessage] = useState('')
    const [chatMessages, setChatMessages] = useState([
        { id: 1, user: 'Sarah K.', message: 'Hâte de commencer !', time: '10:00' },
        { id: 2, user: 'Marc D.', message: 'Le son est parfait chef 👌', time: '10:01' },
    ])
    const [liveStatus, setLiveStatus] = useState(() => {
        const saved = localStorage.getItem('academy_live_status')
        return saved ? JSON.parse(saved) : { isLive: false, title: '', description: '', viewers: 0 }
    })

    // Listen for storage changes (when Admin updates)
    React.useEffect(() => {
        const handleStorageChange = () => {
            const saved = localStorage.getItem('academy_live_status')
            if (saved) setLiveStatus(JSON.parse(saved))
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])


    const activeCourse = course || (process.env.NODE_ENV === 'development' ? mockCourse : null)

    // Redirect if no course (access control)
    if (!activeCourse) {
        return <Navigate to="/academy" replace />
    }

    const isLiveForThisCourse = liveStatus.isLive && liveStatus.targetCourseId === activeCourse.id

    // Auto-switch to Live tab when live starts
    React.useEffect(() => {
        if (isLiveForThisCourse) {
            setActiveTab('live')
        }
    }, [isLiveForThisCourse])

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        const message = {
            id: Date.now(),
            user: "Moi",
            message: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        setChatMessages([...chatMessages, message])
        setNewMessage('')
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            {/* Top Bar */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="bg-primary px-2 py-0.5 rounded text-xs text-white">STUDIO</span>
                        {activeCourse.title}
                    </h1>
                    <p className="text-gray-400 text-sm">avec {activeCourse.instructor}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setActiveTab('modules')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'modules' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Modules
                    </button>
                    <button
                        onClick={() => isLiveForThisCourse && setActiveTab('live')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'live'
                            ? 'bg-red-600 text-white animate-pulse'
                            : isLiveForThisCourse
                                ? 'text-red-500 hover:text-white hover:bg-red-900/30 font-bold'
                                : 'text-gray-600 cursor-not-allowed opacity-50'
                            }`}
                        title={isLiveForThisCourse ? "Rejoindre le direct" : "Aucun direct pour ce cours"}
                    >
                        <Video size={18} />
                        Direct Privé
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <button
                        onClick={() => setActiveTab('modules')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'modules' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        <List size={18} />
                        Modules
                    </button>
                    <button
                        onClick={() => isLiveForThisCourse && setActiveTab('live')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'live'
                            ? 'bg-red-600 text-white animate-pulse'
                            : isLiveForThisCourse
                                ? 'text-red-500 hover:text-white hover:bg-red-900/30 font-bold'
                                : 'text-gray-600 cursor-not-allowed opacity-50'
                            }`}
                        title={isLiveForThisCourse ? "Rejoindre le direct" : "Aucun direct pour ce cours"}
                    >
                        <Video size={18} />
                        Direct Privé
                        {isLiveForThisCourse && <span className="flex h-3 w-3 relative ml-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 group">
                            {activeTab === 'live' ? (
                                isLiveForThisCourse ? (
                                    <div className="absolute inset-0 bg-black">
                                        {liveStatus.roomId ? (
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://meet.jit.si/${liveStatus.roomId}#config.startWithAudioMuted=true&config.startWithVideoMuted=true&interfaceConfig.TOOLBAR_BUTTONS=['chat','raisehand','tileview','fullscreen']`}
                                                title="Jitsi Meet"
                                                frameBorder="0"
                                                allow="camera; microphone; fullscreen; display-capture; autoplay"
                                                allowFullScreen
                                            ></iframe>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                {/* Fallback (should rarely happen if isLive is true) */}
                                                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-2 animate-pulse z-10">
                                                    <span className="w-2 h-2 bg-white rounded-full"></span>
                                                    EN DIRECT DU STUDIO
                                                </div>
                                                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-xs flex items-center gap-2 z-10">
                                                    <Users size={14} />
                                                    {liveStatus.viewers || '1.2k'} spectateurs
                                                </div>
                                                <img src="/images/hero-bg.jpg" alt="Live Stream" className="w-full h-full object-cover opacity-40 blur-sm" />

                                                {/* Audio Visualizer Simulation */}
                                                <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                                                    <div className="flex gap-1 items-end h-16">
                                                        <div className="w-2 bg-red-500 animate-[bounce_1s_infinite] h-8"></div>
                                                        <div className="w-2 bg-red-500 animate-[bounce_1.2s_infinite] h-12"></div>
                                                        <div className="w-2 bg-red-500 animate-[bounce_0.8s_infinite] h-6"></div>
                                                        <div className="w-2 bg-red-500 animate-[bounce_1.1s_infinite] h-14"></div>
                                                        <div className="w-2 bg-red-500 animate-[bounce_0.9s_infinite] h-10"></div>
                                                    </div>
                                                    <p className="text-white font-bold text-lg text-center px-4">
                                                        Le Chef est en direct<br />
                                                        <span className="text-sm font-normal text-gray-300">Diffusion depuis le studio (Audio/Vidéo)</span>
                                                    </p>
                                                </div>

                                                <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-t from-black/90 to-transparent p-4 z-10">
                                                    <h2 className="text-2xl font-bold">{liveStatus.title}</h2>
                                                    <p className="text-gray-300 line-clamp-1">{liveStatus.description}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-center p-8">
                                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                            <Video size={40} className="text-gray-500" />
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">Le chef n'est pas en ligne</h2>
                                        <p className="text-gray-400 max-w-md">
                                            Le bouton "Direct Privé" s'activera automatiquement lorsque le cours commencera. Veuillez patienter.
                                        </p>
                                        <button
                                            onClick={() => setActiveTab('modules')}
                                            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            Retourner aux modules
                                        </button>
                                    </div>
                                )
                            ) : (
                                // Module Video Player
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <img src="/images/academy/african-cuisine.png" alt="Course Module" className="w-full h-full object-cover opacity-40" />
                                    <button className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center hover:bg-primary transition-transform hover:scale-105 shadow-xl group-hover:shadow-primary/50">
                                        <Play size={32} className="ml-1 text-white" />
                                    </button>
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                        <h3 className="text-xl font-bold">{activeCourse.modules[currentModule].title}</h3>
                                        <p className="text-gray-300 text-sm">{activeCourse.modules[currentModule].duration}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions Bar */}
                        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                                    <Heart size={20} />
                                    <span>J'aime</span>
                                </button>
                                <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                                    <Share2 size={20} />
                                    <span>Partager</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Settings size={20} className="text-gray-400 cursor-pointer hover:text-white" />
                            </div>
                        </div>


                        {/* Description / Resources */}
                        <div className="bg-gray-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4">Ressources du cours</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-700/50 rounded-xl flex items-center gap-3 hover:bg-gray-700 transition-colors cursor-pointer">
                                    <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                                        <BookOpen size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Fiche Recette PDF</h4>
                                        <p className="text-xs text-gray-400">2.4 MB</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-700/50 rounded-xl flex items-center gap-3 hover:bg-gray-700 transition-colors cursor-pointer">
                                    <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center">
                                        <Smartphone size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Liste des courses</h4>
                                        <p className="text-xs text-gray-400">Accès mobile</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar (Chat or Modules List) */}
                    <div className="bg-gray-800 rounded-2xl flex flex-col overflow-hidden h-[600px] sticky top-36">
                        {activeTab === 'live' ? (
                            <>
                                <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <MessageCircle size={18} className="text-primary" />
                                        Chat en direct
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600">
                                    {chatMessages.map(msg => (
                                        <div key={msg.id} className="flex gap-3 items-start">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold">
                                                {msg.user.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm font-bold text-gray-300">{msg.user}</span>
                                                    <span className="text-xs text-gray-500">{msg.time}</span>
                                                </div>
                                                <p className="text-sm text-gray-200">{msg.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-gray-900 border-t border-gray-700">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={chatMessage}
                                            onChange={(e) => setChatMessage(e.target.value)}
                                            placeholder="Participez au chat..."
                                            className="flex-1 bg-gray-800 border-gray-700 rounded-full px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                        />
                                        <button type="submit" className="p-2 bg-primary rounded-full hover:bg-primary/90 transition-colors">
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                                    <h3 className="font-bold">Contenu du cours</h3>
                                    <p className="text-sm text-gray-400">{activeCourse.modules.length} modules • 2h 15m total</p>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {activeCourse.modules.map((module, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setCurrentModule(idx)}
                                            className={`p-4 border-b border-gray-700/50 cursor-pointer hover:bg-gray-700/30 transition-colors ${currentModule === idx ? 'bg-gray-700/50 border-l-4 border-l-primary' : ''}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    {module.completed ? (
                                                        <CheckCircle size={16} className="text-green-500" />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full border-2 border-gray-500"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className={`text-sm font-semibold ${currentModule === idx ? 'text-primary' : 'text-gray-300'}`}>
                                                        Module {idx + 1}: {module.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                        <Clock size={12} />
                                                        {module.duration}
                                                        {currentModule === idx && <span className="text-primary font-bold ml-2">En cours</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </main>
        </div>
    )
}
