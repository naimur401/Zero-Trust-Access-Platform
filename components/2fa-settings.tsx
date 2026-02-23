'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Copy, Check } from 'lucide-react'

export function TwoFactorSettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [manualKey, setManualKey] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState<'init' | 'setup' | 'verify' | 'complete'>('init')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleSetup2FA = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to setup 2FA')
        return
      }

      setQrCode(data.data.qrCode)
      setManualKey(data.data.secret)
      setStep('setup')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to verify 2FA')
        return
      }

      setBackupCodes(data.data.backupCodes)
      setTwoFactorEnabled(true)
      setSuccess('2FA enabled successfully!')
      setStep('complete')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Two-Factor Authentication</CardTitle>
              <CardDescription className="text-slate-400">
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            <Badge
              className={twoFactorEnabled ? 'bg-green-600' : 'bg-gray-600'}
            >
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="bg-red-950 border-red-700">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-950 border-green-700">
              <AlertDescription className="text-green-200">{success}</AlertDescription>
            </Alert>
          )}

          {step === 'init' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Two-factor authentication protects your account by requiring a second verification step when you sign in.
              </p>
              <Button
                onClick={handleSetup2FA}
                disabled={loading || twoFactorEnabled}
                className="w-full"
              >
                {twoFactorEnabled ? '2FA Already Enabled' : 'Enable 2FA'}
              </Button>
            </div>
          )}

          {step === 'setup' && (
            <div className="space-y-4">
              <Alert className="bg-blue-950 border-blue-700">
                <AlertDescription className="text-blue-200">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
                </AlertDescription>
              </Alert>

              {qrCode && (
                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <img src={qrCode} alt="2FA QR Code" width={200} height={200} />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-slate-300">Manual Key (if unable to scan):</label>
                <div className="flex gap-2">
                  <Input
                    value={manualKey}
                    readOnly
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  />
                  <Button
                    onClick={() => copyToClipboard(manualKey, 0)}
                    size="sm"
                    variant="outline"
                  >
                    {copiedIndex === 0 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-300">Enter 6-digit code:</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="bg-slate-700 border-slate-600 text-slate-100 text-center text-2xl tracking-widest"
                />
              </div>

              <Button
                onClick={handleVerify2FA}
                disabled={loading || verificationCode.length !== 6}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
              </Button>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4">
              <Alert className="bg-green-950 border-green-700">
                <AlertDescription className="text-green-200">
                  ✓ Two-factor authentication has been enabled!
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm text-slate-300 font-semibold">Backup Codes:</p>
                <p className="text-xs text-slate-400">
                  Save these codes in a secure location. You can use them to login if you lose access to your authenticator app.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="p-2 bg-slate-700 rounded flex items-center justify-between text-mono text-sm"
                    >
                      <span className="text-slate-100">{code}</span>
                      <button
                        onClick={() => copyToClipboard(code, index + 1)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        {copiedIndex === index + 1 ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={() => setStep('init')}>
                Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
