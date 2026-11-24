import type { Metadata } from 'next'
import { fontClassNames } from './fonts'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Online Invitation',
  description: 'Create an online invitation and see who is coming.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${fontClassNames} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
