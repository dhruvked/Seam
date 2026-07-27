import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HealthOS — Your Complete Health Record',
  description: 'Access your complete health records securely using your ABHA ID. Built on the Ayushman Bharat Digital Mission ecosystem.',
  keywords: 'ABHA, health records, ABDM, digital health, India',
  openGraph: {
    title: 'HealthOS — Your Complete Health Record',
    description: 'Access your complete health records securely using your ABHA ID.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
