'use client'

import { useRef } from 'react'
import { useTest } from '@/contexts/TestContext'
import { useToast } from '@/contexts/ToastContext'
import { X, FolderOpen } from 'lucide-react'

export default function SaveLoadModal({ onClose }) {
  const { loadState } = useTest()
  const toast = useToast()
  const fileInputRef = useRef(null)

  const loadProject = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        const loadedData = JSON.parse(content)
        loadState(loadedData)
        toast.success('Project loaded successfully!')
        onClose()
      } catch (error) {
        toast.error('Error loading file. Make sure it\'s a valid project JSON file.')
        console.error(error)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-xl max-w-md w-full border-2 border-gray-200">
        <div className="bg-blue-600 p-6 text-white rounded-lg">
          <div className="flex justify-between items-center ">
            <h2 className="text-2xl font-bold flex items-center gap-3 rounded-xl">
              <FolderOpen className="w-7 h-7" />
              Load Project
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          <div className="bg-white border-2 border-gray-300 rounded-xl p-6">
            <h3 className="font-semibold text-gray-500 mb-3 flex items-center gap-2 text-lg">
              <FolderOpen className="w-5 h-5" />
              Select Project File
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Load a project JSON file that was exported with your test. This will restore all your questions, settings, and configuration.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={loadProject}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
            >
              Choose Project File (.json)
            </button>
            
            <div className="mt-6 p-4 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Audio and image files are not included in the project file. You'll need to re-upload them after loading.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t-2 rounded-lg border-gray-200 p-4 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#96ACDA] hover:bg-[#7a8ec4] text-gray-900 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}