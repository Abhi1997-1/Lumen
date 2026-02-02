'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [verificationSent, setVerificationSent] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback`,
                    },
                })
                if (error) throw error

                if (data.session) {
                    toast.success('Account created successfully')
                    router.refresh()
                    router.push('/dashboard')
                } else {
                    setVerificationSent(true)
                    toast.success('Confirmation email sent! Check your inbox.')
                    setResendCooldown(60) // Start a 60s cooldown for resend UI
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.refresh()
                router.push('/dashboard')
                toast.success('Logged in successfully')
            }
        } catch (error: any) {
            console.error(error)
            if (error.code === 'over_email_send_rate_limit') {
                toast.error('Too many emails sent. Please wait a few minutes before trying again.')
            } else if (error.code === 'email_address_invalid') {
                toast.error('Please enter a valid email address.')
            } else {
                toast.error(error.message || 'Authentication failed')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (resendCooldown > 0) return
        setLoading(true)
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            })
            if (error) throw error
            toast.success('Verification email resent!')
            setResendCooldown(60)
        } catch (error: any) {
            if (error.code === 'over_email_send_rate_limit') {
                toast.error('Too many emails sent. Please wait a few minutes.')
            } else {
                toast.error(error.message || 'Failed to resend email')
            }
        } finally {
            setLoading(false)
        }
    }

    // Effect to handle cooldown timer

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    if (verificationSent) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-muted/40">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Check your email</CardTitle>
                        <CardDescription>
                            We've sent a confirmation link to <strong>{email}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Click the link in the email to sign in. If you don't see it, check your spam folder.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleResend}
                            disabled={loading || resendCooldown > 0}
                        >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
                        </Button>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => setVerificationSent(false)}
                        >
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">{isSignUp ? 'Sign Up' : 'Login'}</CardTitle>
                    <CardDescription>
                        {isSignUp
                            ? 'Enter your email below to create your account'
                            : 'Enter your email below to login to your account'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                        </Button>
                        <Button
                            variant="link"
                            type="button"
                            className="w-full text-sm text-muted-foreground"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp
                                ? 'Already have an account? Sign In'
                                : "Don't have an account? Sign Up"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
