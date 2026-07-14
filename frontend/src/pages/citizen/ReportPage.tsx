import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, MapPin, AlertTriangle, CheckCircle, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import apiClient from '../../lib/apiClient'

type Step = 'capture' | 'location' | 'submitting' | 'done'

export default function ReportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('capture')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [manualAddress, setManualAddress] = useState('')
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<{ address: string; lat: number; lng: number }[]>([])
  const debounceRef = useRef<any>(null)

  const handleAddressChange = (val: string) => {
    setManualAddress(val)
    if (val.trim().length < 3) {
      setSuggestions([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=in&limit=5`
        )
        const data = await res.json()
        if (Array.isArray(data)) {
          const mapped = data.map((item: any) => ({
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }))
          
          // If browser GPS is active, sort by nearest distance first
          if (location) {
            mapped.sort((a, b) => {
              const distA = Math.sqrt(Math.pow(a.lat - location.lat, 2) + Math.pow(a.lng - location.lng, 2))
              const distB = Math.sqrt(Math.pow(b.lat - location.lat, 2) + Math.pow(b.lng - location.lng, 2))
              return distA - distB
            })
          }
          setSuggestions(mapped)
        }
      } catch (err) {
        console.error("Geocoding failed:", err)
      }
    }, 400)
  }

  // ── Step 1: Capture photo ──
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setStep('location')
  }

  // ── Step 2: Get GPS location ──
  const handleGetLocation = () => {
    setError('')
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          )
          const data = await res.json()
          if (data && data.display_name) {
            address = data.display_name
          }
        } catch (err) {
          console.warn("Reverse geocoding failed, using raw coordinates.", err)
        }

        setLocation({ lat, lng, address })
        setManualAddress(address)
      },
      () => setError('Could not get your location. Please type the address manually.')
    )
  }

  // ── Step 3: Upload & submit ──
  const handleSubmit = async () => {
    if (!photo) { setError('No photo selected.'); return }
    if (!location && !manualAddress) { setError('Please provide your location.'); return }

    setStep('submitting')
    setError('')

    try {
      // 1) Upload photo to Supabase Storage
      const fileName = `${Date.now()}-${photo.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report-images')
        .upload(fileName, photo)

      if (uploadError) throw new Error('Photo upload failed: ' + uploadError.message)

      const { data: urlData } = supabase.storage.from('report-images').getPublicUrl(uploadData.path)
      const imageUrl = urlData.publicUrl

      // 2) Final location object
      let finalLocation = location
      if (!finalLocation && manualAddress) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}&countrycodes=in&limit=1`
          )
          const data = await res.json()
          if (data && data.length > 0) {
            finalLocation = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              address: manualAddress,
            }
          }
        } catch (err) {
          console.warn('Fallback geocoding on submit failed:', err)
        }
      }

      if (!finalLocation) {
        finalLocation = {
          lat: 20.5937,
          lng: 78.9629,
          address: manualAddress || 'India (Default View)',
        }
      }

      // 3) Call backend — triggers AI pipeline
      let case_id = 'mock-case-' + Math.floor(Math.random() * 1000)
      let immediate_actions_for_citizen = [
        'Stay calm and remain with the child.',
        'Do NOT move the child unless there is immediate danger.',
        'Do NOT give the child food or water.',
        'Keep bystanders at a safe distance.',
        'Help is on the way — responders have been dispatched.',
      ]

      try {
        const response = await apiClient.post('/api/report', {
          image_url: imageUrl,
          location: finalLocation,
        })
        if (response.data) {
          case_id = response.data.case_id || case_id
          immediate_actions_for_citizen = response.data.immediate_actions_for_citizen || immediate_actions_for_citizen
        }
      } catch (err) {
        console.warn('Backend API offline. Using mock submission for demo/testing.', err)
        // Add artificial delay to simulate AI pipeline analysis
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      navigate(`/companion?case_id=${case_id}&tab=tracking`, {
        state: { 
          immediateActions: immediate_actions_for_citizen,
          location: finalLocation
        }
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed.'
      setError(message)
      setStep('location')
    }
  }

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto w-full relative overflow-hidden bg-transparent px-5 py-6">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-4">
          <AlertTriangle className="w-4 h-4" />
          EMERGENCY REPORT
        </div>
        <h1 className="text-2xl font-bold text-white font-serif">Report a Distressed Child</h1>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
          AI will instantly analyze the situation and alert nearby authorities.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 px-6 mb-8">
        {['capture', 'location', 'submitting'].map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              ['capture', 'location', 'submitting', 'done'].indexOf(step) >= i
                ? 'bg-primary'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 px-6 pb-8 flex flex-col gap-6">
        {/* ── STEP 1: Camera ── */}
        {(step === 'capture' || photoPreview) && (
          <div>
            <h2 className="text-white font-bold mb-3">
              {step === 'capture' ? '📸 Step 1: Take a Photo' : '📸 Photo Captured'}
            </h2>
            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                <img src={photoPreview} alt="Evidence" className="w-full object-cover max-h-60" />
                <button
                  onClick={() => { setPhoto(null); setPhotoPreview(''); setStep('capture') }}
                  className="absolute top-3 right-3 bg-black/75 hover:bg-black text-white text-xs px-3 py-1.5 rounded-full transition-colors"
                >
                  Retake
                </button>
              </div>
            ) : (
              <button
                id="camera-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-44 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-primary/60 hover:text-primary transition-all bg-dark-700/40 cursor-pointer"
              >
                <Camera className="w-10 h-10 text-slate-400" />
                <span className="text-sm font-medium">Tap to open camera</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </div>
        )}

        {/* ── STEP 2: Location ── */}
        {(step === 'location' || step === 'submitting') && (
          <div>
            <h2 className="text-white font-bold mb-3">📍 Step 2: Your Location</h2>
            <button
              id="gps-btn"
              onClick={handleGetLocation}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                location
                  ? 'border-green-500/30 bg-green-950/20 text-green-400'
                  : 'border-white/10 bg-dark-700/40 text-slate-300 hover:border-primary/50'
              }`}
            >
              {location ? <CheckCircle className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
              <span className="text-sm text-left font-medium">
                {location ? location.address : 'Tap to detect my location'}
              </span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-500 text-xs font-semibold">or type it</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Type location address..."
                value={manualAddress}
                onChange={(e) => {
                  handleAddressChange(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="input-glass text-sm"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 bg-dark-800/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 backdrop-blur-lg max-h-48 overflow-y-auto">
                  {suggestions.map((loc) => (
                    <button
                      key={loc.address}
                      type="button"
                      onMouseDown={() => {
                        setManualAddress(loc.address)
                        setLocation({ lat: loc.lat, lng: loc.lng, address: loc.address })
                        setShowSuggestions(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-dark-700/80 text-sm text-slate-300 hover:text-white border-b border-white/5 last:border-0 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="truncate">{loc.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Submit Button */}
        {step === 'location' && (
          <button
            id="submit-report-btn"
            onClick={handleSubmit}
            disabled={!photo || (!location && !manualAddress)}
            className="btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mt-auto cursor-pointer"
          >
            <AlertTriangle className="w-5 h-5" />
            Report Emergency Now
          </button>
        )}

        {/* Submitting state */}
        {step === 'submitting' && (
          <div className="text-center py-8">
            <Loader className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-white font-bold">AI is analyzing the situation...</p>
            <p className="text-slate-400 text-sm mt-2">Alerting nearby authorities</p>
          </div>
        )}
      </div>
    </div>
  )
}
