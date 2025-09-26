import React from 'react'

export default function TestDashboard() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      color: '#1f2937',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        🎉 Test Dashboard Working!
      </h1>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Authentication Test</h2>
        <p>✅ React is loading</p>
        <p>✅ Routing is working</p>
        <p>✅ Dashboard component renders</p>

        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Next Steps:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>🔍 Check authentication context</li>
            <li>📊 Load user data</li>
            <li>🎨 Apply full styling</li>
          </ul>
        </div>

        <div style={{ marginTop: '20px' }}>
          <a
            href="/login"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}