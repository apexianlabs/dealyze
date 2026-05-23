export const metadata = {
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  title: 'Dealyze — AI real estate deal analyser — address in, verdict out',
  description: 'AI real estate deal analyser — address in, verdict out',
}
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      </head>
      <body style={{margin:0,padding:0,fontFamily:'Inter,sans-serif'}}>{children}</body>
    </html>
  )
}
