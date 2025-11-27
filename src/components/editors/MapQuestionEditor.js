'use client'

import { useState, useRef } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { convertToBase64 } from '@/lib/utils'
import { Map, Plus, X } from 'lucide-react'
import AlternativeAnswersField from '../AlternativeAnswersField'
export default function MapQuestionEditor({ question, onUpdate }) {
  const [mapImage, setMapImage] = useState(question.mapImage || null)
  const [questionList, setQuestionList] = useState(question.questionList || [])
  const mapInputRef = useRef(null)
  const toast = useToast()

  const handleMapUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file too large. Maximum size is 10MB.')
      return
    }
    
    const imageBase64 = await convertToBase64(file)
    setMapImage({ file, base64: imageBase64 })
    onUpdate({ ...question, mapImage: { file, base64: imageBase64 } })
    toast.success('Map image uploaded successfully!')
  }

  const addQuestionItem = () => {
    const newItem = { 
      number: questionList.length > 0 ? Math.max(...questionList.map(q => q.number)) + 1 : 1,
      word: '', 
      answer: '' 
    }
    const newList = [...questionList, newItem]
    setQuestionList(newList)
    onUpdate({ ...question, questionList: newList })
  }

  const updateQuestionItem = (index, field, value) => {
    const updatedList = questionList.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    )
    setQuestionList(updatedList)
    onUpdate({ ...question, questionList: updatedList })
  }

  const removeQuestionItem = (index) => {
    const updatedList = questionList.filter((_, i) => i !== index)
    setQuestionList(updatedList)
    onUpdate({ ...question, questionList: updatedList })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">Instructions</label>
        <textarea
          value={question.text || ''}
          onChange={(e) => onUpdate({ ...question, text: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-50 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-gray-200 font-mono"
          rows="3"
          placeholder="Label the map below. Write the correct letter, A-H, next to Questions 11-16."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">Map/Diagram Image</label>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            mapImage ? 'border-gray-200 bg-blue-600 bg-opacity-10' : 'border-gray-600 hover:border-gray-200'
          }`}
          onClick={() => mapInputRef.current?.click()}
        >
          <input
            ref={mapInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.svg"
            onChange={handleMapUpload}
            className="hidden"
          />
          <Map className="w-12 h-12 text-gray-500 mb-4 mx-auto" />
          {mapImage ? (
            <div>
              <p className="text-lg font-semibold text-blue-600 mb-2">{mapImage.file?.name || 'Map uploaded'}</p>
              <div className="mt-4 max-w-md mx-auto">
                <img 
                  src={mapImage.base64 || (mapImage.file ? URL.createObjectURL(mapImage.file) : '')} 
                  alt="Map preview" 
                  className="w-full h-auto rounded-lg border-2 border-gray-200"
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-gray-600 mb-2">Click to upload map/diagram</p>
              <p className="text-sm text-gray-500">JPG, PNG, GIF, SVG (max 10MB)</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-semibold text-gray-600">Question Items</label>
          <button
            onClick={addQuestionItem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
        
        {questionList.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 items-center bg-blue-600 bg-opacity-20 p-3 rounded-lg font-semibold text-gray-900">
              <div className="col-span-2">Q#</div>
              <div className="col-span-4">Word/Phrase</div>
              <div className="col-span-5">Correct Answer</div>
              <div className="col-span-1">Actions</div>
            </div>
            {questionList.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-700">
                <div className="col-span-2">
                  <input
  type="text"
  value={index + 1}
  readOnly
  className="w-full px-4 py-3 border-2 border-gray-600 bg-gray-700 text-gray-500 rounded-xl font-mono cursor-not-allowed"
/>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={item.word}
                    onChange={(e) => updateQuestionItem(index, 'word', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 bg-white text-gray-900 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., cafe, toilets"
                  />
                </div>
                <div className="col-span-5">
  <AlternativeAnswersField
    answers={item.answers || (item.answer ? [item.answer] : [])}
    onChange={(answers) => {
      const updatedList = questionList.map((q, i) => 
        i === index 
          ? { ...q, answers: answers, answer: answers[0] || '' }
          : q
      )
      setQuestionList(updatedList)
      onUpdate({ ...question, questionList: updatedList })
    }}
    compact={true}
  />
</div>
                <div className="col-span-1">
                  <button
                    onClick={() => removeQuestionItem(index)}
                    className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
            <Map className="w-12 h-12 mx-auto mb-2 text-gray-600" />
            <p>No question items added yet</p>
          </div>
        )}
      </div>
    </div>
  )
}