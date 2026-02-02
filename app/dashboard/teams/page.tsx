import { Button } from "@/components/ui/button"
import { Users, UserPlus, Mail } from "lucide-react"

export default function TeamsPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="h-24 w-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 ring-1 ring-blue-500/20">
                <Users className="h-10 w-10 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Team Collaboration</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                Invite your team to share meeting insights, collaborate on action items, and build a knowledge base together.
            </p>
            <div className="flex gap-4">
                <Button className="gap-2">
                    <UserPlus className="h-4 w-4" /> Invite Members
                </Button>
                <Button variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" /> Contact Sales
                </Button>
            </div>
        </div>
    )
}
