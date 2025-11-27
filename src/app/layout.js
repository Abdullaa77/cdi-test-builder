import './globals.css'
import { BrandingProvider } from '@/contexts/BrandingContext'

export const metadata = {
  title: 'CDI Test Builder',
  description: 'Create professional IELTS practice tests with your own branding',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BrandingProvider>
          {children}
        </BrandingProvider>
      </body>
    </html>
  )
}