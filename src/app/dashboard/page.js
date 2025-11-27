'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Folder, Trash2, Edit, LogOut, Clock, Palette } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    loadUserAndProjects()
  }, [])

  const loadUserAndProjects = async () => {
    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Fetch user's projects
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.warn('Error fetching projects:', error.message)
      } else {
        setProjects(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      setProjects([])
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/login'
    }
  }

  const handleCreateProject = () => {
    router.push('/builder')
  }

  const handleOpenProject = (project) => {
    router.push(`/builder?projectId=${project.id}`)
  }

  const handleDeleteProject = async (projectId, projectName) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(projectId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        alert('Error deleting project: ' + error.message)
      } else {
        setProjects(projects.filter(p => p.id !== projectId))
      }
    } catch (err) {
      alert('Error deleting project')
    } finally {
      setDeleting(null)
    }
  }

  const getProjectStats = (projectData) => {
    const listening = projectData?.listening || {}
    const reading = projectData?.reading || {}
    const writing = projectData?.writing || {}

    const listeningQuestions = listening.parts?.reduce((sum, part) => sum + (part.questions?.length || 0), 0) || 0
    const readingQuestions = reading.passages?.reduce((sum, passage) => sum + (passage.questions?.length || 0), 0) || 0
    const writingTasks = (writing.task1?.prompt ? 1 : 0) + (writing.task2?.prompt ? 1 : 0)

    return {
      listening: listeningQuestions,
      reading: readingQuestions,
      writing: writingTasks,
      total: listeningQuestions + readingQuestions + writingTasks
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">CDI</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CDI Test Builder</h1>
                <p className="text-gray-500">Create IELTS tests with your branding</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-2">
                <p className="text-sm text-gray-500">Signed in as</p>
                <p className="text-gray-900 font-semibold">{user?.email}</p>
              </div>
              <button
                onClick={() => router.push('/branding')}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 border border-gray-300"
              >
                <Palette size={18} />
                <span className="font-medium">Branding</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 border border-gray-300 hover:border-red-300"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">My Projects</h2>
              <p className="text-gray-500">
                {projects.length === 0 ? 'No projects yet' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={handleCreateProject}
              className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Create New Project</span>
            </button>
          </div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <Folder className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">Create your first IELTS test project to get started</p>
              <button
                onClick={handleCreateProject}
                className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={20} />
                <span>Create Project</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const stats = getProjectStats(project.project_data)
                return (
                  <div
                    key={project.id}
                    className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-400 transition-all hover:shadow-md"
                  >
                    {/* Project Name */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                          {project.project_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock size={14} />
                          <span>{formatDate(project.updated_at)}</span>
                        </div>
                      </div>
                      <Folder className="text-blue-600" size={24} />
                    </div>

                    {/* Stats */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Listening:</span>
                        <span className="text-gray-900 font-semibold">{stats.listening} questions</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Reading:</span>
                        <span className="text-gray-900 font-semibold">{stats.reading} questions</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Writing:</span>
                        <span className="text-gray-900 font-semibold">{stats.writing} tasks</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenProject(project)}
                        className="flex-1 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit size={16} />
                        <span>Open</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.project_name)}
                        disabled={deleting === project.id}
                        className="bg-red-100 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deleting === project.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}