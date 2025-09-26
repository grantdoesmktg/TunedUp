import React, { useState } from 'react'

export default function SimpleLogin() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleTestingBypass = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/testing-bypass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'grantdoesmktg@gmail.com' })
      })

      if (response.ok) {
        window.location.href = '/dashboard'
      } else {
        setMessage('Testing bypass failed')
      }
    } catch (error) {
      setMessage('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      color: '#1f2937',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
          TunedUp
        </h1>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#4b5563' }}>
          Sign in to your account
        </h2>

        {message && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '12px', color: '#92400e', marginBottom: '8px' }}>
            🧪 Testing Mode
          </p>
          <button
            onClick={handleTestingBypass}
            disabled={loading}
            style={{
              backgroundColor: '#d97706',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Logging in...' : 'Bypass Login (Testing)'}
          </button>
        </div>

        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Get started with our free tier:<br />
          <strong>1</strong> performance calc, <strong>1</strong> build plan, <strong>3</strong> images per month
        </p>
      </div>
    </div>
  )
}