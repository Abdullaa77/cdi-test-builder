'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const BrandingContext = createContext(null)

const defaultBranding = {
  primary_color: '#3B82F6',
  secondary_color: '#1E40AF',
  accent_color: '#F59E0B',
  logo_base64: null,
  logo_filename: null,
  telegram_username: '',
  academy_name: 'Your Academy'
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(defaultBranding)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadBranding()
  }, [])

  const loadBranding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_branding')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setBranding({
          primary_color: data.primary_color || defaultBranding.primary_color,
          secondary_color: data.secondary_color || defaultBranding.secondary_color,
          accent_color: data.accent_color || defaultBranding.accent_color,
          logo_base64: data.logo_base64,
          logo_filename: data.logo_filename,
          telegram_username: data.telegram_username || '',
          academy_name: data.academy_name || defaultBranding.academy_name
        })
      }
    } catch (error) {
      console.error('Error loading branding:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshBranding = () => {
    loadBranding()
  }

  return (
    <BrandingContext.Provider value={{ branding, loading, refreshBranding, defaultBranding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}
