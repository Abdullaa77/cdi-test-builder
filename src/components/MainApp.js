'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTest } from '@/contexts/TestContext'
import { useToast } from '@/contexts/ToastContext'
import ProjectSetup from './ProjectSetup'
import TestSelector from './TestSelector'
import TestBuilder from './TestBuilder'

export default function MainApp({ projectId, userId }) {
  const router = useRouter()
  const { state, loadState } = useTest()
  const toast = useToast()
  const [currentScreen, setCurrentScreen] = useState('setup')
  const [selectedTestType, setSelectedTestType] = useState(null)
  const [currentProjectId, setCurrentProjectId] = useState(projectId)
  const [loading, setLoading] = useState(!!projectId)
  const [lastSaved, setLastSaved] = useState(Date.now())

  // Load project if projectId is provided
  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    }
  }, [projectId])

  // Auto-save functionality - save every 30 seconds when project name is set
  useEffect(() => {
    if (!state.projectName || !userId) return

    const interval = setInterval(() => {
      saveProject()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [state, userId, currentProjectId])

  // Save before unload
  useEffect(() => {
    if (!state.projectName || !userId) return

    const handleBeforeUnload = (e) => {
      saveProject()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state, userId, currentProjectId])

  const loadProject = async (id) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        toast.error('Failed to load project')
        router.push('/dashboard')
        return
      }

      if (data) {
        loadState(data.project_data)
        setCurrentProjectId(data.id)
        setCurrentScreen('selector')
        toast.success(`Loaded project: ${data.project_name}`)
      }
    } catch (err) {
      console.error('Error loading project:', err)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const saveProject = async () => {
    if (!state.projectName || !userId) return

    try {
      const supabase = createClient()

      const projectData = {
        user_id: userId,
        project_name: state.projectName,
        project_data: state,
        updated_at: new Date().toISOString(),
      }

      if (currentProjectId) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', currentProjectId)

        if (error) throw error
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('projects')
          .insert([projectData])
          .select()
          .single()

        if (error) throw error
        if (data) {
          setCurrentProjectId(data.id)
        }
      }

      setLastSaved(Date.now())
    } catch (err) {
      console.error('Error saving project:', err)
    }
  }

  const handleBackToDashboard = () => {
    saveProject()
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        {/* Back to Dashboard Button */}
        {currentScreen !== 'setup' && (
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={handleBackToDashboard}
              className="bg-white text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-300 shadow-sm"
            >
              ← Back to Dashboard
            </button>
            {state.projectName && (
              <div className="bg-white text-gray-600 px-4 py-2 rounded-xl border border-gray-300 shadow-sm">
                <span className="text-sm">Auto-saved</span>
              </div>
            )}
          </div>
        )}

        {currentScreen === 'setup' && (
          <ProjectSetup onContinue={() => setCurrentScreen('selector')} />
        )}

        {currentScreen === 'selector' && (
          <TestSelector
            onTestSelect={(type) => {
              setSelectedTestType(type)
              setCurrentScreen('builder')
            }}
          />
        )}

        {currentScreen === 'builder' && selectedTestType && (
          <TestBuilder
            testType={selectedTestType}
            onBack={() => {
              setCurrentScreen('selector')
              setSelectedTestType(null)
            }}
          />
        )}
      </div>
    </div>
  )
}