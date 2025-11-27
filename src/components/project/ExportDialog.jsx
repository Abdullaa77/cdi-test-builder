import { useState, useEffect } from 'react'
import { Download, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { generateListeningHTML, generateReadingHTML, generateWritingHTML } from '@/lib/htmlTemplates'
import { createClient } from '@/lib/supabase/client'

export default function ExportDialog({ project, answerKey, onClose }) {
  const [exporting, setExporting] = useState(false)
  const [branding, setBranding] = useState(null)
  const [brandingLoaded, setBrandingLoaded] = useState(false)
  const supabase = createClient()

  // Fetch branding on mount
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Current user:', user?.id)
        
        if (user) {
          const { data, error } = await supabase
            .from('user_branding')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          console.log('Branding fetch result:', { data, error })
          
          if (data) {
            setBranding(data)
          }
        }
      } catch (err) {
        console.error('Error fetching branding:', err)
      } finally {
        setBrandingLoaded(true)
      }
    }
    fetchBranding()
  }, [])

  const handleExport = async () => {
    // Wait for branding to load if not ready
    if (!brandingLoaded) {
      console.log('Waiting for branding to load...')
      return
    }

    setExporting(true)

    try {
      console.log('Using answer key in ExportDialog:', answerKey)
      console.log('Using branding:', branding)

      let html = ''
      
      if (project.type === 'listening') {
        const listeningData = {
          ...project.listening,
          type: 'listening',
          title: project.listening.title,
          duration: project.listening.duration,
          parts: project.listening.parts,
          audioFiles: project.listening.audioFiles
        }
        html = await generateListeningHTML(listeningData, project.projectName, answerKey, branding)
      } else if (project.type === 'reading') {
        const readingData = {
          type: 'reading',
          title: project.reading.title,
          duration: project.reading.duration,
          parts: project.reading.passages
        }
        html = await generateReadingHTML(readingData, project.projectName, answerKey, branding)
      } else if (project.type === 'writing') {
        const writingData = {
          ...project.writing,
          type: 'writing',
          title: project.writing.title,
          duration: project.writing.duration,
          task1: project.writing.task1,
          task2: project.writing.task2
        }
        html = await generateWritingHTML(writingData, project.projectName, branding)
      }

      // Create and download HTML file
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.projectName.replace(/\s+/g, '_')}_${project.type}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setTimeout(() => {
        setExporting(false)
        onClose()
      }, 500)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export test. Please try again.')
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Export Test</h3>
            <p className="text-sm text-gray-600">{project.name}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Test Features:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Students enter Candidate ID + Password (ID = Password)</li>
                <li>Timed test with auto-submission</li>
                <li>Automatic PDF result generation</li>
                <li>Your branding applied to exported test</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Branding Preview */}
        {!brandingLoaded ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">Loading branding...</span>
            </div>
          </div>
        ) : branding ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-2">Branding Preview:</p>
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded"
                style={{ backgroundColor: branding.primary_color }}
              />
              <span className="text-sm font-medium">{branding.academy_name || 'Your Academy'}</span>
              {branding.telegram_username && (
                <span className="text-xs text-gray-500">@{branding.telegram_username}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">No custom branding set. <a href="/branding" className="underline">Set up branding</a></p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={exporting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Export HTML
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}