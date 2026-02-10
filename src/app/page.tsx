'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Settings, Users, Clock, DollarSign } from 'lucide-react'

interface MeetingState {
  isRunning: boolean
  startTime: Date | null
  duration: number // in seconds
  attendees: number
  hourlyRate: number
}

export default function MeetingCostCalculator() {
  const [meeting, setMeeting] = useState<MeetingState>({
    isRunning: false,
    startTime: null,
    duration: 0,
    attendees: 5,
    hourlyRate: 50
  })

  const [showSettings, setShowSettings] = useState(false)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (meeting.isRunning) {
      interval = setInterval(() => {
        setMeeting(prev => ({
          ...prev,
          duration: prev.duration + 1
        }))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [meeting.isRunning])

  const startMeeting = () => {
    setMeeting(prev => ({
      ...prev,
      isRunning: true,
      startTime: new Date()
    }))
  }

  const pauseMeeting = () => {
    setMeeting(prev => ({
      ...prev,
      isRunning: false
    }))
  }

  const resetMeeting = () => {
    setMeeting(prev => ({
      ...prev,
      isRunning: false,
      startTime: null,
      duration: 0
    }))
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const calculateCost = () => {
    const hoursElapsed = meeting.duration / 3600
    return meeting.attendees * meeting.hourlyRate * hoursElapsed
  }

  const calculateCostPerMinute = () => {
    return (meeting.attendees * meeting.hourlyRate) / 60
  }

  const cost = calculateCost()
  const costPerMinute = calculateCostPerMinute()
  
  // Get cost level for color coding
  const getCostLevel = () => {
    if (cost < 100) return 'low'
    if (cost < 500) return 'medium'
    if (cost < 1000) return 'high'
    return 'extreme'
  }

  const costLevel = getCostLevel()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
            💰 Meeting Cost Calculator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            See how much your meetings really cost. The numbers might shock you.
          </p>
        </div>

        {/* Main Calculator */}
        <div className="max-w-4xl mx-auto">
          {/* Current Cost Display */}
          <div className={`text-center mb-12 p-8 rounded-3xl border-4 ${
            costLevel === 'low' ? 'border-green-500 bg-green-500/10' :
            costLevel === 'medium' ? 'border-yellow-500 bg-yellow-500/10' :
            costLevel === 'high' ? 'border-orange-500 bg-orange-500/10' :
            'border-red-500 bg-red-500/10'
          } transition-all duration-500`}>
            <div className="text-7xl font-bold mb-4">
              £{cost.toFixed(2)}
            </div>
            <div className="text-2xl text-gray-300 mb-6">
              This meeting has cost you
            </div>
            
            {meeting.isRunning && (
              <div className={`text-lg font-semibold animate-pulse ${
                costLevel === 'extreme' ? 'text-red-400' : 'text-orange-400'
              }`}>
                +£{costPerMinute.toFixed(2)} per minute
              </div>
            )}
          </div>

          {/* Timer and Controls */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Timer */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="text-4xl font-mono font-bold mb-4">
                {formatDuration(meeting.duration)}
              </div>
              <div className="text-gray-300 mb-6">Meeting Duration</div>
              
              <div className="flex justify-center space-x-4">
                {!meeting.isRunning ? (
                  <button
                    onClick={startMeeting}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Meeting</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseMeeting}
                    className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105"
                  >
                    <Pause className="w-5 h-5" />
                    <span>Pause</span>
                  </button>
                )}
                
                <button
                  onClick={resetMeeting}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-6 py-4 rounded-xl font-semibold transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Meeting Setup</span>
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-300 mb-2 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Number of Attendees</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={meeting.attendees}
                    onChange={(e) => setMeeting(prev => ({ ...prev, attendees: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Average Hourly Rate (£)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={meeting.hourlyRate}
                    onChange={(e) => setMeeting(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold">{meeting.attendees}</div>
              <div className="text-gray-300 text-sm">Attendees</div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold">£{meeting.hourlyRate}</div>
              <div className="text-gray-300 text-sm">Per Hour</div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold">£{costPerMinute.toFixed(0)}</div>
              <div className="text-gray-300 text-sm">Per Minute</div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold">£{(costPerMinute / 60).toFixed(1)}</div>
              <div className="text-gray-300 text-sm">Per Second</div>
            </div>
          </div>

          {/* Shocking Facts */}
          {cost > 0 && (
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold mb-4 text-red-300">💡 Put This in Perspective</h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl mb-2">🍕</div>
                  <div className="text-lg font-semibold">{Math.floor(cost / 15)} Pizzas</div>
                  <div className="text-sm text-gray-300">You could buy this many pizzas</div>
                </div>
                <div>
                  <div className="text-3xl mb-2">☕</div>
                  <div className="text-lg font-semibold">{Math.floor(cost / 4)} Coffees</div>
                  <div className="text-sm text-gray-300">Equivalent Starbucks visits</div>
                </div>
                <div>
                  <div className="text-3xl mb-2">🎬</div>
                  <div className="text-lg font-semibold">{Math.floor(cost / 12)} Movies</div>
                  <div className="text-sm text-gray-300">Cinema tickets you could afford</div>
                </div>
              </div>
            </div>
          )}

          {/* Share/Export */}
          <div className="text-center bg-white/5 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4">Share the Reality Check</h3>
            <p className="text-gray-300 mb-6">
              Help others understand the true cost of meetings
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-all">
                📊 Export Report
              </button>
              <button className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-all">
                🔗 Share Link
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-400">
          <p className="mb-2">
            💡 <strong>Tip:</strong> Could this meeting have been an email?
          </p>
          <p className="text-sm">
            Built to help teams make smarter meeting decisions
          </p>
        </div>
      </div>
    </div>
  )
}