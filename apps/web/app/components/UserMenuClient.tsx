"use client"

import { usePathname } from "next/navigation"
import Image from "next/image"
import { useState, useEffect } from "react"

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function UserMenuClient({ user, logoutAction }: { user: User, logoutAction: () => Promise<void> }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!user) return null

  const isBuilder = pathname?.startsWith("/builder")
  const isSurveys = pathname?.startsWith("/surveys")
  const isSurveyRunner = pathname?.includes("/survey/")
  
  if (isBuilder || isSurveys || isSurveyRunner) return null; 

  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    top: '1.5rem',
    right: '2rem',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    background: isBuilder ? 'var(--surface)' : 'rgba(15, 23, 42, 0.6)', // Darker glass for main app which seems to have dark header
    backdropFilter: 'blur(12px)',
    padding: '0.375rem 0.5rem 0.375rem 1rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border)',
    borderColor: isBuilder ? 'var(--border)' : 'rgba(255, 255, 255, 0.1)',
    boxShadow: 'var(--shadow-md)',
    transition: 'all var(--transition-normal)',
    color: isBuilder ? 'var(--text-primary)' : '#f8fafc',
    ...(mounted ? {} : { opacity: 0 }) 
  }

  // Text color logic
  const textColor = isBuilder ? 'var(--text-primary)' : '#f8fafc'
  const subTextColor = isBuilder ? 'var(--text-secondary)' : '#94a3b8'

  return (
    <div className="user-menu-container" style={baseStyle}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-end', 
        lineHeight: '1.2',
      }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: textColor, letterSpacing: '-0.01em' }}>{user.name}</span>
        <span style={{ fontSize: '0.75rem', color: subTextColor, fontWeight: 500 }}>Admin</span>
      </div>
      
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {user.image ? (
          <Image 
            src={user.image} 
            alt="Profile" 
            width={36} 
            height={36} 
            style={{ 
              borderRadius: '50%', 
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
            }} 
          />
        ) : (
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: '50%', 
            background: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white', 
            fontSize: '0.875rem', 
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {user.name?.charAt(0) || 'U'}
          </div>
        )}
      </div>

      <div style={{ width: '1px', height: '24px', background: isBuilder ? 'var(--border)' : 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }}></div>

      <form action={logoutAction}>
        <button 
          type="submit" 
          style={{
            background: 'transparent',
            border: 'none',
            color: isBuilder ? 'var(--text-secondary)' : '#cbd5e1',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s',
          }}
          className="hover-bg-action"
          title="Sign out"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isBuilder ? 'var(--gray-100)' : 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = 'var(--error)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = isBuilder ? 'var(--text-secondary)' : '#cbd5e1'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </form>
    </div>
  )
}
