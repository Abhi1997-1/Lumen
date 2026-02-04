import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, FileText, Shield, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function HelpPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Help & Support</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Contact Support */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            Contact Support
                        </CardTitle>
                        <CardDescription>
                            Need help with your account or having technical issues?
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Our support team is available Mon-Fri, 9am - 5pm EST.
                        </p>
                        <Button variant="outline" className="w-full">
                            Email Support
                        </Button>
                    </CardContent>
                </Card>

                {/* Documentation */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Documentation
                        </CardTitle>
                        <CardDescription>
                            Learn how to use Lumen Notes effectively.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <Link href="/dashboard/help/getting-started" className="flex items-center gap-2 hover:text-primary hover:bg-primary/5 p-2 rounded-lg transition-all">
                                <ExternalLink className="h-4 w-4" /> Getting Started Guide
                            </Link>
                            <Link href="/dashboard/help/integrations" className="flex items-center gap-2 hover:text-primary hover:bg-primary/5 p-2 rounded-lg transition-all">
                                <ExternalLink className="h-4 w-4" /> Connecting Integrations
                            </Link>
                            <Link href="/dashboard/help/recording-guide" className="flex items-center gap-2 hover:text-primary hover:bg-primary/5 p-2 rounded-lg transition-all">
                                <ExternalLink className="h-4 w-4" /> Recording Best Practices
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Legal & Privacy */}
                <Card className="bg-card border-border md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Legal & Privacy
                        </CardTitle>
                        <CardDescription>
                            Review our policies and terms of service.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Link href="/legal/privacy" className="group block p-4 rounded-xl border border-border bg-accent/20 hover:bg-accent/40 transition-colors">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">Privacy Policy</h3>
                                <p className="text-xs text-muted-foreground">
                                    How we handle your data, usage of AI APIs, and recording ownership.
                                </p>
                            </Link>

                            <Link href="/legal/terms" className="group block p-4 rounded-xl border border-border bg-accent/20 hover:bg-accent/40 transition-colors">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">Terms of Use</h3>
                                <p className="text-xs text-muted-foreground">
                                    User responsibilities, recording usage restrictions, and liability disclaimers.
                                </p>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
