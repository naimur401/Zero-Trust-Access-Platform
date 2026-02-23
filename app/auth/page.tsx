import { AuthForm } from '@/components/auth-form'
import { ThemeToggle } from '@/components/theme-toggle'

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">🔐 Zero Trust</h1>
          <p className="text-muted-foreground">AI-Powered Access Control Platform</p>
        </div>
        <AuthForm />
      </div>
    </main>
  )
}
