'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordStrength, setPasswordStrength] = useState(0)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Calculate password strength
    const calculateStrength = (pass: string) => {
        let strength = 0
        if (pass.length >= 8) strength++
        if (pass.length >= 12) strength++
        if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++
        if (/\d/.test(pass)) strength++
        if (/[^a-zA-Z0-9]/.test(pass)) strength++
        return strength
    }

    const handlePasswordChange = (newPassword: string) => {
        setPassword(newPassword)
        setPasswordStrength(calculateStrength(newPassword))
    }

    const getStrengthColor = () => {
        if (passwordStrength <= 1) return 'bg-red-500'
        if (passwordStrength <= 3) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    const getStrengthText = () => {
        if (passwordStrength <= 1) return 'Weak'
        if (passwordStrength <= 3) return 'Medium'
        return 'Strong'
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            toast.success('Password updated successfully!')
            setTimeout(() => {
                router.push('/login')
            }, 1000)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to reset password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your new password below
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                            />
                            {password && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${getStrengthColor()}`}
                                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground">{getStrengthText()}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Use 8+ characters with a mix of letters, numbers & symbols
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm">Confirm Password</Label>
                            <Input
                                id="confirm"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Reset Password'}
                        </Button>
                        <Link href="/login" className="text-sm text-center text-muted-foreground hover:text-foreground">
                            Back to Login
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
