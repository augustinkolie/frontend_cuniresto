import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, User, Mic } from 'lucide-react'

export default function VoiceMessagePlayer({ audioUrl, isOwn = false, senderAvatar }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [playbackRate, setPlaybackRate] = useState(1)
    const audioRef = useRef(null)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleLoadedMetadata = () => {
            setDuration(audio.duration)
        }

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime)
        }

        const handleEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
        }

        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleProgressClick = (e) => {
        const audio = audioRef.current
        if (!audio) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        const newTime = percentage * duration
        audio.currentTime = newTime
        setCurrentTime(newTime)
    }

    const togglePlaybackRate = () => {
        const audio = audioRef.current
        if (!audio) return

        const rates = [1, 1.5, 2]
        const currentIndex = rates.indexOf(playbackRate)
        const nextIndex = (currentIndex + 1) % rates.length
        const newRate = rates[nextIndex]

        audio.playbackRate = newRate
        setPlaybackRate(newRate)
    }

    const formatTime = (seconds) => {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    // Génération de barres de waveform simplifiées
    const waveformBars = [3, 7, 4, 8, 5, 9, 6, 8, 4, 7, 5, 8, 6, 9, 7, 8, 5, 6, 4, 7, 5, 8, 4, 6, 7, 9, 5, 8, 4, 7, 6, 8, 5, 9, 7, 4, 8, 6, 5, 7]

    return (
        <div className={`p-1 flex flex-col min-w-[240px] max-w-[300px]`}>
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            <div className="flex items-center gap-2">
                {/* Avatar avec badge Micro */}
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-sm border border-gray-100/10">
                        {senderAvatar ? (
                            <img src={`http://localhost:8000${senderAvatar}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                <User size={24} />
                            </div>
                        )}
                    </div>
                    {/* Badge Micro Cyan/Bleu style WhatsApp */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white dark:bg-[#202c33] rounded-full flex items-center justify-center shadow-sm">
                        <div className="w-3.5 h-3.5 text-[#34b7f1] flex items-center justify-center">
                            <Mic size={14} fill="currentColor" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-1 pr-1">
                    <div className="flex items-center gap-2">
                        {/* Bouton Play Simple */}
                        <button
                            onClick={togglePlay}
                            className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-opacity active:opacity-50"
                        >
                            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                        </button>

                        {/* Waveform Style WhatsApp */}
                        <div className="flex-1 relative h-6 flex items-center group cursor-pointer" onClick={handleProgressClick}>
                            <div className="flex items-center gap-[1.5px] w-full">
                                {waveformBars.map((height, index) => {
                                    const barProgress = (index / waveformBars.length) * 100
                                    const isActive = barProgress <= progress
                                    return (
                                        <div
                                            key={index}
                                            className={`w-[1.5px] rounded-full transition-all flex-shrink-0 ${isActive
                                                ? 'bg-[#34b7f1]'
                                                : 'bg-gray-400/50 dark:bg-gray-600'
                                                }`}
                                            style={{
                                                height: `${4 + (height * 1.5)}px`
                                            }}
                                        />
                                    )
                                })}
                            </div>

                            {/* Le petit curseur (dot) sur la progression */}
                            <div
                                className="absolute h-3 w-3 bg-[#34b7f1] rounded-full shadow-sm transition-all duration-75 pointer-events-none"
                                style={{ left: `calc(${progress}% - 6px)` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-[10px] tabular-nums font-medium opacity-70">
                            {formatTime(isPlaying ? currentTime : (isFinite(duration) ? duration : 0))}
                        </span>

                        {/* Optionnel: Vitesse de lecture si non-WA-vanilla mais utile */}
                        {isPlaying && (
                            <button
                                onClick={togglePlaybackRate}
                                className="px-1.5 rounded-full bg-black/5 dark:bg-white/10 text-[9px] font-bold h-4 flex items-center hover:bg-black/10 transition"
                            >
                                {playbackRate}x
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
