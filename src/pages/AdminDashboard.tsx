import React, { useState, useEffect } from 'react'
import { useAuth } from '../../shared/contexts/AuthContext'
import { Header } from '../../shared/components/Header'
import { Footer } from '../../shared/components/Footer'

interface User {
  email: string
  planCode: string
  perfUsed: number
  buildUsed: number
  imageUsed: number
  resetDate: string
  createdAt: string
  stripeCustomerId?: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  // Check if user is admin
  if (!user || user.email !== 'grantdoesmktg@gmail.com') {
    return (
      <div className="min-h-screen bg-background text-textPrimary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-textSecondary">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/user?action=all')
      const data = await response.json()

      if (response.ok) {
        setUsers(data)
      } else {
        setMessage('Failed to fetch users: ' + data.error)
      }
    } catch (error) {
      setMessage('Error fetching users')
    } finally {
      setLoading(false)
    }
  }

  const upgradeUser = async (email: string, newPlan: string) => {
    setUpgrading(email)
    setMessage('')

    try {
      const response = await fetch('/api/admin/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          action: 'upgrade',
          newPlan
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Successfully upgraded ${email} to ${newPlan}`)
        await fetchUsers() // Refresh the list
      } else {
        setMessage('Upgrade failed: ' + data.error)
      }
    } catch (error) {
      setMessage('Error upgrading user')
    } finally {
      setUpgrading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'bg-gray-100 text-gray-800'
      case 'PLUS': return 'bg-blue-100 text-blue-800'
      case 'PRO': return 'bg-purple-100 text-purple-800'
      case 'ULTRA': return 'bg-orange-100 text-orange-800'
      case 'ADMIN': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#07fef7] to-[#d82c83] bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-textSecondary">Manage users and their plan subscriptions</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('Successfully')
              ? 'bg-success/20 border border-success text-success'
              : 'bg-error/20 border border-error text-error'
          }`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-textSecondary">Loading users...</p>
          </div>
        ) : (
          <div className="bg-secondary rounded-xl border border-divider overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-divider">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-textPrimary">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-textPrimary">Plan</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-textPrimary">Usage</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-textPrimary">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-textPrimary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {users.map((user) => (
                    <tr key={user.email} className="hover:bg-background/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-textPrimary">{user.email}</div>
                        {user.stripeCustomerId && (
                          <div className="text-xs text-textSecondary">Stripe Customer</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(user.planCode)}`}>
                          {user.planCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-textSecondary">
                        <div>Perf: {user.perfUsed}</div>
                        <div>Build: {user.buildUsed}</div>
                        <div>Image: {user.imageUsed}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-textSecondary">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {['FREE', 'PLUS', 'PRO', 'ULTRA', 'ADMIN'].map((plan) => (
                            <button
                              key={plan}
                              onClick={() => upgradeUser(user.email, plan)}
                              disabled={upgrading === user.email || user.planCode === plan}
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                user.planCode === plan
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-primary text-white hover:bg-primary/80 disabled:opacity-50'
                              }`}
                            >
                              {upgrading === user.email ? '...' : plan}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-textSecondary">No users found.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-sm text-textSecondary">
          <p>Total Users: {users.length}</p>
        </div>
      </div>

      <Footer />
    </div>
  )
}