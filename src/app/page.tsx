'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Users, Clock, PoundSterling, DollarSign, History, X, Copy, Check, Trash2 } from 'lucide-react'

interface MeetingState {
  isRunning: boolean
  duration: number
  attendees: number
  hourlyRate: number
  currency: '£' | '$'
}

interface MeetingRecord {
  id: string
  date: string
  duration: number
  attendees: number
  hourlyRate: number
  currency: string
  cost: number
}

const STORAGE_KEY = 'meetingcost-history'
const SETTINGS_KEY = 'meetingcost-settings'

function loadHistory(): MeetingRecord[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveHistory(records: MeetingRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50)))
}

function loadSettings(): Pick<MeetingState, 'attendees' | 'hourlyRate' | 'currency'> {
  if (typeof window === 'undefined') return { attendees: 5, hourlyRate: 50, currency: '£' }
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return {
      attendees: s.attendees || 5,
      hourlyRate: s.hourlyRate || 50,
      currency: s.currency || '£',
    }
  } catch { return { attendees: 5, hourlyRate: 50, currency: '£' } }
}

function saveSettings(s: Pick<MeetingState, 'attendees' | 'hourlyRate' | 'currency'>) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDurationWords(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (parts.length === 0) parts.push(`${seconds}s`)
  return parts.join(' ')
}

export default function MeetingCostCalculator() {
  const [meeting, setMeeting] = useState<MeetingState>({
    isRunning: false,
    duration: 0,
    attendees: 5,
    hourlyRate: 50,
    currency: '£',
  })
  const [history, setHistory] = useState<MeetingRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load settings on mount
  useEffect(() => {
    const s = loadSettings()
    setMeeting(prev => ({ ...prev, ...s }))
    setHistory(loadHistory())
    setMounted(true)
  }, [])

  // Save settings when they change
  useEffect(() => {
    if (!mounted) return
    saveSettings({ attendees: meeting.attendees, hourlyRate: meeting.hourlyRate, currency: meeting.currency })
  }, [meeting.attendees, meeting.hourlyRate, meeting.currency, mounted])

  // Timer
  useEffect(() => {
    if (!meeting.isRunning) return
    const interval = setInterval(() => {
      setMeeting(prev => ({ ...prev, duration: prev.duration + 1 }))
    }, 1000)
    return () => clearInterval(interval)
  }, [meeting.isRunning])

  const cost = (meeting.duration / 3600) * meeting.attendees * meeting.hourlyRate
  const costPerMinute = (meeting.attendees * meeting.hourlyRate) / 60

  const costLevel = cost < 100 ? 'low' : cost < 500 ? 'medium' : cost < 1000 ? 'high' : 'extreme'

  const borderColor = {
    low: 'border-green-500 bg-green-500/10',
    medium: 'border-yellow-500 bg-yellow-500/10',
    high: 'border-orange-500 bg-orange-500/10',
    extreme: 'border-red-500 bg-red-500/10',
  }[costLevel]

  const startMeeting = () => setMeeting(prev => ({ ...prev, isRunning: true }))
  const pauseMeeting = () => setMeeting(prev => ({ ...prev, isRunning: false }))

  const resetMeeting = useCallback(() => {
    // Save to history if there was a meaningful meeting (>10s)
    if (meeting.duration > 10) {
      const record: MeetingRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: meeting.duration,
        attendees: meeting.attendees,
        hourlyRate: meeting.hourlyRate,
        currency: meeting.currency,
        cost,
      }
      const updated = [record, ...history].slice(0, 50)
      setHistory(updated)
      saveHistory(updated)
    }
    setMeeting(prev => ({ ...prev, isRunning: false, duration: 0 }))
  }, [meeting, cost, history])

  const clearHistory = () => {
    setHistory([])
    saveHistory([])
  }

  const getSummaryText = () => {
    const c = meeting.currency
    return [
      `Meeting Cost Summary`,
      `Duration: ${formatDurationWords(meeting.duration)}`,
      `Attendees: ${meeting.attendees}`,
      `Avg hourly rate: ${c}${meeting.hourlyRate}`,
      `Total cost: ${c}${cost.toFixed(2)}`,
      `Cost per minute: ${c}${costPerMinute.toFixed(2)}`,
      ``,
      `Could this meeting have been an email?`,
      `meetingcost.vercel.app`,
    ].join('\n')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getSummaryText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const c = meeting.currency

  const totalHistoryCost = history.reduce((sum, r) => sum + r.cost, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
            💰 MeetingCost
          </h1>
          <p className="text-lg text-gray-300">
            See how much your meetings really cost
          </p>
        </div>

        {/* Cost Display */}
        <div className={`text-center mb-10 p-6 sm:p-8 rounded-3xl border-4 ${borderColor} transition-all duration-500`}>
          <div className="text-5xl sm:text-7xl font-bold mb-3 font-mono tabular-nums">
            {c}{cost.toFixed(2)}
          </div>
          <div className="text-xl text-gray-300 mb-4">
            {meeting.duration === 0 ? 'Ready to start' : 'This meeting has cost'}
          </div>
          {meeting.isRunning && (
            <div className={`text-lg font-semibold animate-pulse ${costLevel === 'extreme' ? 'text-red-400' : 'text-orange-400'}`}>
              +{c}{costPerMinute.toFixed(2)} per minute
            </div>
          )}
        </div>

        {/* Timer + Settings */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Timer */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 mb-3">
              <Clock className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider">Duration</span>
            </div>
            <div className="text-4xl font-mono font-bold mb-6 tabular-nums">
              {formatDuration(meeting.duration)}
            </div>
            <div className="flex justify-center gap-3">
              {!meeting.isRunning ? (
                <button
                  onClick={startMeeting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold transition-all active:scale-95"
                >
                  <Play className="w-5 h-5" />
                  <span>{meeting.duration > 0 ? 'Resume' : 'Start'}</span>
                </button>
              ) : (
                <button
                  onClick={pauseMeeting}
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-xl font-semibold transition-all active:scale-95"
                >
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </button>
              )}
              <button
                onClick={resetMeeting}
                className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 px-5 py-3 rounded-xl font-semibold transition-all active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
                <span>End</span>
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Meeting Setup</h3>
              <button
                onClick={() => setMeeting(prev => ({ ...prev, currency: prev.currency === '£' ? '$' : '£' }))}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-all"
              >
                {c === '£' ? <PoundSterling className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                <span>{c === '£' ? 'GBP' : 'USD'}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                  <Users className="w-4 h-4" />
                  Attendees
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMeeting(prev => ({ ...prev, attendees: Math.max(1, prev.attendees - 1) }))}
                    className="bg-white/10 hover:bg-white/20 w-10 h-10 rounded-lg font-bold text-lg transition-all"
                  >-</button>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={meeting.attendees}
                    onChange={(e) => setMeeting(prev => ({ ...prev, attendees: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white text-center focus:outline-none focus:border-white/40"
                  />
                  <button
                    onClick={() => setMeeting(prev => ({ ...prev, attendees: prev.attendees + 1 }))}
                    className="bg-white/10 hover:bg-white/20 w-10 h-10 rounded-lg font-bold text-lg transition-all"
                  >+</button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                  {c === '£' ? <PoundSterling className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                  Avg Hourly Rate
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[30, 50, 75, 100, 150].map(rate => (
                    <button
                      key={rate}
                      onClick={() => setMeeting(prev => ({ ...prev, hourlyRate: rate }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        meeting.hourlyRate === rate
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-gray-300'
                      }`}
                    >
                      {c}{rate}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    value={meeting.hourlyRate}
                    onChange={(e) => setMeeting(prev => ({ ...prev, hourlyRate: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-20 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center text-sm focus:outline-none focus:border-white/40"
                    placeholder="Custom"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-xl font-bold">{meeting.attendees}</div>
            <div className="text-gray-400 text-xs">Attendees</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-xl font-bold">{c}{meeting.hourlyRate}</div>
            <div className="text-gray-400 text-xs">Per Hour</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-xl font-bold">{c}{costPerMinute.toFixed(0)}</div>
            <div className="text-gray-400 text-xs">Per Minute</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-xl font-bold">{c}{(meeting.attendees * meeting.hourlyRate).toFixed(0)}</div>
            <div className="text-gray-400 text-xs">Per Hour (all)</div>
          </div>
        </div>

        {/* Perspective */}
        {cost > 0 && (
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-red-300">💡 Perspective</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl mb-1">☕</div>
                <div className="font-semibold">{Math.floor(cost / 4)} Coffees</div>
              </div>
              <div>
                <div className="text-2xl mb-1">🍕</div>
                <div className="font-semibold">{Math.floor(cost / 15)} Pizzas</div>
              </div>
              <div>
                <div className="text-2xl mb-1">🎬</div>
                <div className="font-semibold">{Math.floor(cost / 12)} Movies</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button
            onClick={handleCopy}
            disabled={meeting.duration === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-xl font-semibold transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl font-semibold transition-all"
          >
            <History className="w-4 h-4" />
            <span>History ({history.length})</span>
          </button>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Meeting History</h3>
              <div className="flex gap-2">
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
                <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {history.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No meetings recorded yet. End a meeting to save it here.</p>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">
                          {r.attendees} people, {formatDurationWords(r.duration)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-orange-400">
                        {r.currency}{r.cost.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-center">
                  <span className="text-gray-400">Total wasted: </span>
                  <span className="text-xl font-bold text-red-400">{c}{totalHistoryCost.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-12">
          <p>💡 Could this meeting have been an email?</p>
        </div>
      </div>
    </div>
  )
}
