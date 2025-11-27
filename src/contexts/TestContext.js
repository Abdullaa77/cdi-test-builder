'use client'

import { createContext, useContext, useReducer, useCallback } from 'react'

const TestContext = createContext()

const initialState = {
  projectName: '',
  testPassword: '1234',
  listening: {
    title: 'IELTS Listening Practice',
    instructions: 'Listen to the audio and answer the questions.',
    duration: 30,
    audioFiles: [null, null, null, null],
    audioDurations: [0, 0, 0, 0],
    parts: [
      { questions: [] },
      { questions: [] },
      { questions: [] },
      { questions: [] }
    ]
  },
  reading: {
    title: 'IELTS Reading Practice',
    instructions: 'Read the passages and answer the questions.',
    duration: 60,
    passages: [
      { title: '', text: '', questions: [] },
      { title: '', text: '', questions: [] },
      { title: '', text: '', questions: [] }
    ]
  },
  writing: {
    title: 'IELTS Writing Practice',
    duration: 60,
    task1: { prompt: 'Summarise the information by selecting and reporting the main features.', image: null },
    task2: { prompt: 'To what extent do you agree or disagree? Give reasons for your answer.' }
  }
}

function testReducer(state, action) {
  switch (action.type) {
    case 'SET_PROJECT_NAME':
      return { ...state, projectName: action.value }
    case 'SET_PASSWORD':
      return { ...state, testPassword: action.value }
    case 'UPDATE_FIELD':
      return { ...state, [action.testType]: { ...state[action.testType], [action.field]: action.value } }
    case 'UPDATE_NESTED':
      return { ...state, [action.testType]: { ...state[action.testType], [action.parent]: { ...state[action.testType][action.parent], [action.field]: action.value } } }
    case 'UPDATE_PASSAGE':
      return { 
        ...state, 
        reading: { 
          ...state.reading, 
          passages: state.reading.passages.map((p, i) => 
            i === action.index ? { ...p, [action.field]: action.value } : p
          ) 
        } 
      }
    case 'SET_AUDIO':
      return { 
        ...state, 
        listening: { 
          ...state.listening, 
          audioFiles: state.listening.audioFiles.map((f, i) => i === action.partIndex ? action.file : f),
          audioDurations: state.listening.audioDurations.map((d, i) => i === action.partIndex ? action.duration : d)
        } 
      }
    case 'SET_IMAGE':
      return { ...state, writing: { ...state.writing, task1: { ...state.writing.task1, image: action.file } } }
    case 'ADD_QUESTION':
      if (action.testType === 'listening') {
        return {
          ...state,
          listening: {
            ...state.listening,
            parts: state.listening.parts.map((part, i) =>
              i === action.partIndex
                ? { ...part, questions: [...part.questions, { ...action.question, id: Date.now() + Math.random() }] }
                : part
            )
          }
        }
      } else if (action.testType === 'reading') {
        return {
          ...state,
          reading: {
            ...state.reading,
            passages: state.reading.passages.map((passage, i) =>
              i === action.passageIndex
                ? { ...passage, questions: [...passage.questions, { ...action.question, id: Date.now() + Math.random() }] }
                : passage
            )
          }
        }
      }
      return state
    case 'UPDATE_QUESTION':
      if (action.testType === 'listening') {
        return {
          ...state,
          listening: {
            ...state.listening,
            parts: state.listening.parts.map((part, pIdx) =>
              pIdx === action.partIndex
                ? {
                    ...part,
                    questions: part.questions.map((q, qIdx) =>
                      qIdx === action.questionIndex ? { ...q, ...action.updates } : q
                    )
                  }
                : part
            )
          }
        }
      } else if (action.testType === 'reading') {
        return {
          ...state,
          reading: {
            ...state.reading,
            passages: state.reading.passages.map((passage, pIdx) =>
              pIdx === action.passageIndex
                ? {
                    ...passage,
                    questions: passage.questions.map((q, qIdx) =>
                      qIdx === action.questionIndex ? { ...q, ...action.updates } : q
                    )
                  }
                : passage
            )
          }
        }
      }
      return state
    case 'REMOVE_QUESTION':
      if (action.testType === 'listening') {
        return {
          ...state,
          listening: {
            ...state.listening,
            parts: state.listening.parts.map((part, pIdx) =>
              pIdx === action.partIndex
                ? { ...part, questions: part.questions.filter((_, qIdx) => qIdx !== action.questionIndex) }
                : part
            )
          }
        }
      } else if (action.testType === 'reading') {
        return {
          ...state,
          reading: {
            ...state.reading,
            passages: state.reading.passages.map((passage, pIdx) =>
              pIdx === action.passageIndex
                ? { ...passage, questions: passage.questions.filter((_, qIdx) => qIdx !== action.questionIndex) }
                : passage
            )
          }
        }
      }
      return state
    case 'DUPLICATE_QUESTION':
      if (action.testType === 'listening') {
        const partToDuplicate = state.listening.parts[action.partIndex]
        const questionToDuplicate = partToDuplicate.questions[action.questionIndex]
        const duplicatedQuestion = { ...questionToDuplicate, id: Date.now() + Math.random() }
        return {
          ...state,
          listening: {
            ...state.listening,
            parts: state.listening.parts.map((part, pIdx) =>
              pIdx === action.partIndex
                ? {
                    ...part,
                    questions: [
                      ...part.questions.slice(0, action.questionIndex + 1),
                      duplicatedQuestion,
                      ...part.questions.slice(action.questionIndex + 1)
                    ]
                  }
                : part
            )
          }
        }
      } else if (action.testType === 'reading') {
        const passageToDuplicate = state.reading.passages[action.passageIndex]
        const questionToDuplicate = passageToDuplicate.questions[action.questionIndex]
        const duplicatedQuestion = { ...questionToDuplicate, id: Date.now() + Math.random() }
        return {
          ...state,
          reading: {
            ...state.reading,
            passages: state.reading.passages.map((passage, pIdx) =>
              pIdx === action.passageIndex
                ? {
                    ...passage,
                    questions: [
                      ...passage.questions.slice(0, action.questionIndex + 1),
                      duplicatedQuestion,
                      ...passage.questions.slice(action.questionIndex + 1)
                    ]
                  }
                : passage
            )
          }
        }
      }
      return state
    case 'LOAD_STATE':
  return {
    ...initialState,  // Start with default structure
    ...action.state,  // Overlay loaded data
    // Ensure nested objects are properly merged
    listening: action.state.listening || initialState.listening,
    reading: action.state.reading || initialState.reading,
    writing: action.state.writing || initialState.writing,
  }
    case 'RESET_STATE':
      return initialState
    default:
      return state
  }
}

export function TestProvider({ children }) {
  const [state, dispatch] = useReducer(testReducer, initialState)

  const actions = {
    setProjectName: useCallback((value) => dispatch({ type: 'SET_PROJECT_NAME', value }), []),
    setPassword: useCallback((value) => dispatch({ type: 'SET_PASSWORD', value }), []),
    updateField: useCallback((testType, field, value) => dispatch({ type: 'UPDATE_FIELD', testType, field, value }), []),
    updateNested: useCallback((testType, parent, field, value) => dispatch({ type: 'UPDATE_NESTED', testType, parent, field, value }), []),
    updatePassage: useCallback((index, field, value) => dispatch({ type: 'UPDATE_PASSAGE', index, field, value }), []),
    setAudio: useCallback((partIndex, file, duration = 0) => dispatch({ type: 'SET_AUDIO', partIndex, file, duration }), []),
    setImage: useCallback((file) => dispatch({ type: 'SET_IMAGE', file }), []),
    addQuestion: useCallback((testType, question, partOrPassageIndex) => {
      if (testType === 'listening') {
        dispatch({ type: 'ADD_QUESTION', testType, question, partIndex: partOrPassageIndex })
      } else if (testType === 'reading') {
        dispatch({ type: 'ADD_QUESTION', testType, question, passageIndex: partOrPassageIndex })
      }
    }, []),
    updateQuestion: useCallback((testType, partOrPassageIndex, questionIndex, updates) => {
      if (testType === 'listening') {
        dispatch({ type: 'UPDATE_QUESTION', testType, partIndex: partOrPassageIndex, questionIndex, updates })
      } else if (testType === 'reading') {
        dispatch({ type: 'UPDATE_QUESTION', testType, passageIndex: partOrPassageIndex, questionIndex, updates })
      }
    }, []),
    removeQuestion: useCallback((testType, partOrPassageIndex, questionIndex) => {
      if (testType === 'listening') {
        dispatch({ type: 'REMOVE_QUESTION', testType, partIndex: partOrPassageIndex, questionIndex })
      } else if (testType === 'reading') {
        dispatch({ type: 'REMOVE_QUESTION', testType, passageIndex: partOrPassageIndex, questionIndex })
      }
    }, []),
    duplicateQuestion: useCallback((testType, partOrPassageIndex, questionIndex) => {
      if (testType === 'listening') {
        dispatch({ type: 'DUPLICATE_QUESTION', testType, partIndex: partOrPassageIndex, questionIndex })
      } else if (testType === 'reading') {
        dispatch({ type: 'DUPLICATE_QUESTION', testType, passageIndex: partOrPassageIndex, questionIndex })
      }
    }, []),
    loadState: useCallback((newState) => dispatch({ type: 'LOAD_STATE', state: newState }), []),
    resetState: useCallback(() => dispatch({ type: 'RESET_STATE' }), [])
  }

  return <TestContext.Provider value={{ state, ...actions }}>{children}</TestContext.Provider>
}

export const useTest = () => useContext(TestContext)