'use client'

import { useState } from 'react'
import { useTest } from '@/contexts/TestContext'
import { useToast } from '@/contexts/ToastContext'
import SaveLoadModal from './LoadProjectModal'
import { CheckCircle, FolderOpen, Award } from 'lucide-react'

export default function ProjectSetup({ onContinue }) {
  const { state, setProjectName } = useTest()
  const [tempProjectName, setTempProjectName] = useState(state.projectName)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const toast = useToast()

  const handleContinue = () => {
    if (!tempProjectName.trim()) {
      toast.error('Please enter a project name')
      return
    }
    setProjectName(tempProjectName.trim())
    onContinue()
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border border-gray-200">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">CDI</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">CDI Test Builder</h2>
        <h3 className="text-xl font-semibold text-blue-600 mb-2">Project Setup</h3>
        <p className="text-gray-500">Set up your IELTS test project folder</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Project/Folder Name</label>
          <input
            type="text"
            value={tempProjectName}
            onChange={(e) => setTempProjectName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            placeholder="e.g., IELTS_Practice_Test_01"
          />
          <p className="text-sm text-gray-500 mt-2">
            All three test files (Listening.html, Reading.html, Writing.html) will be organized under this folder name.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
            <Award className="w-6 h-6 text-blue-600" />
            Test Suite Features
          </h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>Three-step authentication: Candidate ID → Password → Instructions</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>Three standalone HTML test files with automatic navigation</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>Built-in answer checking and PDF results generation</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>Your custom branding applied to exported tests</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>Map/diagram labelling with image upload support</span>
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowLoadModal(true)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 border border-gray-300"
          >
            <FolderOpen className="w-5 h-5" />
            Load Project
          </button>
          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Continue to Test Builder
          </button>
        </div>
      </div>

      {showLoadModal && <SaveLoadModal onClose={() => setShowLoadModal(false)} />}
    </div>
  )
}