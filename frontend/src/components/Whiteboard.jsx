import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { Eraser } from '@phosphor-icons/react'

export default function Whiteboard() {
  const handleMount = (editor) => {
    // Save editor instance to window for debugging or future features if needed
    window.editor = editor
  }

  const handleClear = () => {
    if (window.editor) {
      if (window.confirm('Are you sure you want to clear the entire whiteboard?')) {
        const shapeIds = Array.from(window.editor.getCurrentPageShapeIds())
        window.editor.deleteShapes(shapeIds)
      }
    }
  }

  return (
    <div className="whiteboard-wrapper animate-fadeIn" style={{ height: '75vh', position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleClear}
          style={{ 
            background: '#ef4444', 
            color: '#fff', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '12px', 
            cursor: 'pointer', 
            fontWeight: '700', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Eraser size={20} weight="bold" /> Clear Board
        </button>
      </div>
      <Tldraw onMount={handleMount} hideUi={false} inferDarkMode={false} />
    </div>
  )
}
