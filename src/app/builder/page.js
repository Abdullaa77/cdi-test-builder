import { Suspense } from 'react'
import BuilderClient from './BuilderClient'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Loading...</p>
        </div>
      </div>
    }>
      <BuilderClient />
    </Suspense>
  )
}
