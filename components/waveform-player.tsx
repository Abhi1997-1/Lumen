"use client"

import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface WaveformPlayerProps {
  audioUrl: string
  className?: string
}

export function WaveformPlayer({ audioUrl, className }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(59, 130, 246, 0.4)", // Blue-500 equivalent with opacity
      progressColor: "#3b82f6", // Blue-500
      cursorColor: "#60a5fa", // Blue-400
      barWidth: 2,
      barGap: 3, // Spaced out bars for cleaner look
      barRadius: 3,
      height: 120, // Taller visualizer
      normalize: true,
      minPxPerSec: 50,
    })

    wavesurfer.current.load(audioUrl)

    wavesurfer.current.on("ready", () => {
      setDuration(wavesurfer.current?.getDuration() || 0)
    })

    wavesurfer.current.on("audioprocess", () => {
      setCurrentTime(wavesurfer.current?.getCurrentTime() || 0)
    })

    wavesurfer.current.on("finish", () => {
      setIsPlaying(false)
    })

    return () => {
      wavesurfer.current?.destroy()
    }
  }, [audioUrl])

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause()
      setIsPlaying(!isPlaying)
    }
  }

  const skipForward = () => {
    if (wavesurfer.current) {
      wavesurfer.current.skip(5)
    }
  }

  const skipBackward = () => {
    if (wavesurfer.current) {
      wavesurfer.current.skip(-5)
    }
  }

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0]
    setVolume(vol)
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(vol)
    }
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    if (wavesurfer.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      wavesurfer.current.setVolume(newMuted ? 0 : volume)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm", className)}>
      {/* Waveform Container */}
      <div className="relative w-full rounded-md bg-muted/30 p-4 ring-1 ring-inset ring-border/50">
        <div ref={containerRef} className="w-full cursor-pointer" />
        
        {/* Time Overlay */}
        <div className="absolute top-2 right-2 text-xs font-mono text-muted-foreground bg-background/80 px-2 py-1 rounded backdrop-blur-sm">
           {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={skipBackward} className="h-8 w-8 text-muted-foreground hover:text-foreground">
             <SkipBack className="h-4 w-4" />
           </Button>
           
           <Button 
            size="icon" 
            onClick={togglePlay} 
            className="h-10 w-10 rounded-full shadow-md bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
           >
             {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
           </Button>

           <Button variant="ghost" size="icon" onClick={skipForward} className="h-8 w-8 text-muted-foreground hover:text-foreground">
             <SkipForward className="h-4 w-4" />
           </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 min-w-[120px]">
          <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 text-muted-foreground">
            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-24 cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
