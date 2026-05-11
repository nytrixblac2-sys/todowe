import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');`

const style = document.createElement('style')
style.textContent = `
  ${fontImport}
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body { transition: background 0.25s ease; }
  ::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: none; opacity: 1; }
  }
  @keyframes slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to   { transform: none; opacity: 1; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  select option { background: #16213e; }
  input[type="range"] { -webkit-appearance: none; appearance: none; }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
