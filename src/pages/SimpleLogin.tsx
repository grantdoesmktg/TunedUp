import React, { useState } from 'react'
import { useAuth } from '../../shared/contexts/AuthContext'

export default function SimpleLogin() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setMessage('')

    try {
      const result = await login(email)
      setMessage(result.message)
    } catch (error) {
      setMessage('An error occurred. Please try again.')
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
          Sign in with Magic Link
        </h2>

        {message && (
          <div style={{
            backgroundColor: message.includes('sent') ? '#d1fae5' : '#fef3c7',
            border: `1px solid ${message.includes('sent') ? '#10b981' : '#f59e0b'}`,
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px',
            color: message.includes('sent') ? '#065f46' : '#92400e'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#374151'
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || !email ? 'not-allowed' : 'pointer',
              opacity: loading || !email ? 0.5 : 1
            }}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>


        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Get started with our free tier:<br />
          <strong>1</strong> performance calc, <strong>1</strong> build plan, <strong>3</strong> images per month
        </p>
      </div>
    </div>
  )
}