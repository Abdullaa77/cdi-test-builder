import { LOGO_URLS } from '@/constants/questionTypes'

export default function ImperialLogo({ size = 'md', variant = 'main' }) {
  const sizes = {
    sm: 'w-12 h-12 p-2',
    md: 'w-16 h-16 p-3',
    lg: 'w-24 h-24 p-4',
    xlg: 'w-50 h-24 p-5',
    xl: 'w-40 h-40 p-5'  
  }

  const logoUrl = LOGO_URLS[variant] || LOGO_URLS.main

  return (
    <div className={`${sizes[size]} rounded-2xl flex items-center justify-center shadow-xl bg-white`}>
      <img 
        src={logoUrl} 
        alt="Imperial Academy" 
        className="w-full h-full object-contain"
      />
    </div>
  )
}