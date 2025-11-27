'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Upload, Save, Eye, Palette, Image, MessageCircle, Building2 } from 'lucide-react'

export default function BrandingPage() {
  const router = useRouter()
  const supabase = createClient()
  const logoInputRef = useRef(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  
  // Branding state
  const [branding, setBranding] = useState({
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    accent_color: '#F59E0B',
    logo_base64: null,
    logo_filename: null,
    telegram_username: '',
    academy_name: 'Your Academy'
  })

  // Check auth and load branding
  useEffect(() => {
    const checkAuthAndLoadBranding = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      // Load existing branding
      const { data, error } = await supabase
        .from('user_branding')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (data) {
        setBranding({
          primary_color: data.primary_color || '#3B82F6',
          secondary_color: data.secondary_color || '#1E40AF',
          accent_color: data.accent_color || '#F59E0B',
          logo_base64: data.logo_base64,
          logo_filename: data.logo_filename,
          telegram_username: data.telegram_username || '',
          academy_name: data.academy_name || 'Your Academy'
        })
      }
      
      setLoading(false)
    }
    
    checkAuthAndLoadBranding()
  }, [router, supabase])

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      alert('Please upload a PNG or JPEG image')
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be less than 2MB')
      return
    }
    
    // Convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      setBranding(prev => ({
        ...prev,
        logo_base64: event.target.result,
        logo_filename: file.name
      }))
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setBranding(prev => ({
      ...prev,
      logo_base64: null,
      logo_filename: null
    }))
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const saveBranding = async () => {
    if (!user) return
    
    setSaving(true)
    
    try {
      // Check if branding exists
      const { data: existing } = await supabase
        .from('user_branding')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_branding')
          .update({
            primary_color: branding.primary_color,
            secondary_color: branding.secondary_color,
            accent_color: branding.accent_color,
            logo_base64: branding.logo_base64,
            logo_filename: branding.logo_filename,
            telegram_username: branding.telegram_username,
            academy_name: branding.academy_name
          })
          .eq('user_id', user.id)
        
        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_branding')
          .insert({
            user_id: user.id,
            primary_color: branding.primary_color,
            secondary_color: branding.secondary_color,
            accent_color: branding.accent_color,
            logo_base64: branding.logo_base64,
            logo_filename: branding.logo_filename,
            telegram_username: branding.telegram_username,
            academy_name: branding.academy_name
          })
        
        if (error) throw error
      }
      
      alert('Branding saved successfully!')
    } catch (error) {
      console.error('Error saving branding:', error)
      alert('Error saving branding. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Branding Settings</h1>
              <p className="text-sm text-gray-500">Customize how your exported tests look</p>
            </div>
          </div>
          
          <button
            onClick={saveBranding}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Academy Name */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 size={20} className="text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold">Academy Name</h2>
              </div>
              
              <input
                type="text"
                value={branding.academy_name}
                onChange={(e) => setBranding(prev => ({ ...prev, academy_name: e.target.value }))}
                placeholder="Enter your academy name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500">This will appear in the test header</p>
            </div>

            {/* Colors */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Palette size={20} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold">Brand Colors</h2>
              </div>
              
              <div className="space-y-4">
                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                    <span className="text-gray-400 font-normal ml-2">Buttons, headers, highlights</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.primary_color}
                      onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                    />
                    <input
                      type="text"
                      value={branding.primary_color}
                      onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                    <span className="text-gray-400 font-normal ml-2">Navigation, borders</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.secondary_color}
                      onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                    />
                    <input
                      type="text"
                      value={branding.secondary_color}
                      onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                    <span className="text-gray-400 font-normal ml-2">Active states, submit button</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.accent_color}
                      onChange={(e) => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                    />
                    <input
                      type="text"
                      value={branding.accent_color}
                      onChange={(e) => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Image size={20} className="text-green-600" />
                </div>
                <h2 className="text-lg font-semibold">Logo</h2>
              </div>
              
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleLogoUpload}
                className="hidden"
              />
              
              {branding.logo_base64 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={branding.logo_base64}
                      alt="Logo preview"
                      className="h-16 object-contain"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{branding.logo_filename}</p>
                      <p className="text-xs text-gray-500">Click below to change</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Change Logo
                    </button>
                    <button
                      onClick={removeLogo}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Click to upload logo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG or JPEG, max 2MB</p>
                </button>
              )}
            </div>

            {/* Telegram */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <MessageCircle size={20} className="text-sky-600" />
                </div>
                <h2 className="text-lg font-semibold">Telegram Channel</h2>
              </div>
              
              <div className="flex items-center">
                <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">@</span>
                <input
                  type="text"
                  value={branding.telegram_username}
                  onChange={(e) => setBranding(prev => ({ ...prev, telegram_username: e.target.value.replace('@', '') }))}
                  placeholder="your_channel"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">Displayed near Candidate ID as a reminder for students</p>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Eye size={20} className="text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold">Live Preview</h2>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">This is how your test header will look:</p>
              
              {/* Preview Header */}
              <div 
                className="rounded-lg overflow-hidden border border-gray-200"
                style={{ backgroundColor: branding.secondary_color }}
              >
                <div 
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: branding.primary_color }}
                >
                  {/* Timer */}
                  <div className="flex items-center gap-2 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-mono font-bold">60:00</span>
                  </div>
                  
                  {/* Logo */}
                  <div className="flex items-center gap-2">
                    {branding.logo_base64 ? (
                      <img src={branding.logo_base64} alt="Logo" className="h-8 object-contain" />
                    ) : (
                      <span className="text-white font-bold">{branding.academy_name}</span>
                    )}
                  </div>
                  
                  {/* Candidate Info */}
                  <div className="text-white text-sm">
                    <span className="opacity-80">Candidate: </span>
                    <span className="font-medium">John Doe</span>
                  </div>
                </div>
                
                {/* Telegram Banner */}
                {branding.telegram_username && (
                  <div 
                    className="px-4 py-2 text-center text-sm"
                    style={{ backgroundColor: branding.accent_color, color: '#1a1a1a' }}
                  >
                    Join our Telegram: @{branding.telegram_username}
                  </div>
                )}
              </div>

              {/* Preview Submit Button */}
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Submit Button:</p>
                <button
                  className="w-full py-3 rounded-lg font-semibold transition-colors"
                  style={{ 
                    backgroundColor: branding.accent_color,
                    color: branding.accent_color === '#F59E0B' || branding.accent_color.toLowerCase() === '#ffd700' || branding.accent_color.toLowerCase() === '#fed001' ? '#1a1a1a' : '#ffffff'
                  }}
                >
                  Submit Answers
                </button>
              </div>

              {/* Preview Highlight */}
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Highlight Color:</p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  This is an example of <span style={{ backgroundColor: branding.primary_color, padding: '2px 4px', borderRadius: '2px', color: '#fff' }}>highlighted text</span> in the passage.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
