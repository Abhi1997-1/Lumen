export default function TermsOfUse() {
    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Terms of Use</h1>
            <p className="text-sm text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">1. Acceptance of Terms</h2>
                <p>
                    By accessing and using Lumen Notes (the "Service"), you accept and agree to be bound by the terms and provisions of this agreement.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">2. Use License</h2>
                <p>
                    Permission is granted to use the Service for personal or internal business purposes, subject to these Terms. You agreeing not to:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Modify, copy, distribute, or create derivative works of the Service code or proprietary assets.</li>
                    <li>Use the Service for any unlawful purpose, including but not limited to recording individuals without their consent where prohibited by law.</li>
                    <li>Attempt to gain unauthorized access to any portion of the Service or its related systems.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">3. User Responsibilities</h2>
                <p>
                    <strong>Recording Consent:</strong> You acknowledge that you are solely responsible for obtaining all necessary consents from individuals participating in meetings you record. Lumen Notes assumes no liability for your failure to comply with recording laws (e.g., wiretapping statutes).
                </p>
                <p>
                    <strong>API Keys:</strong> If you provide your own API credentials (e.g., Google Gemini API key), you are responsible for any charges or limits incurred on your personal third-party accounts.
                </p>
                <p>
                    <strong>Account Security:</strong> You are responsible for safeguarding your account login credentials.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">4. Disclaimer of Warranties</h2>
                <p className="uppercase text-sm font-semibold tracking-wider text-muted-foreground">Read this carefully</p>
                <p>
                    THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. LUMEN NOTES MAKES NO WARRANTIES, EXPRESSED OR IMPLIED, AND HEREBY DISCLAIMS AND NEGATES ALL OTHER WARRANTIES INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </p>
                <p>
                    WE DO NOT WARRANT THAT THE TRANSCRIPTIONS WILL BE ERROR-FREE, ACCURATE, OR COMPLETE. AI-GENERATED CONTENT MAY CONTAIN HALLUCINATIONS OR INACCURACIES.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">5. Limitation of Liability</h2>
                <p>
                    IN NO EVENT SHALL LUMEN NOTES OR ITS SUPPLIERS BE LIABLE FOR ANY DAMAGES (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF DATA OR PROFIT, OR DUE TO BUSINESS INTERRUPTION) ARISING OUT OF THE USE OR INABILITY TO USE THE SERVICE.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">6. Termination</h2>
                <p>
                    We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">7. Governing Law</h2>
                <p>
                    These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which the Service provider is established, and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">8. Contact</h2>
                <p>
                    For any questions regarding these Terms, please contact us via the support section of the application.
                </p>
            </section>
        </div>
    )
}
