import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

declare const Office: any

// Render only once Office is ready, so mailbox.item is populated.
function mount() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
if (typeof Office !== 'undefined' && Office.onReady) {
  Office.onReady(() => mount())
} else {
  mount()
}
