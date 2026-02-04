export default function PrivacyPolicy() {
    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">1. Introduction</h2>
                <p>
                    Lumen Notes ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our audio recording and transcription application (the "Service").
                </p>
                <p>
                    By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with these terms, please do not use the Service.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">2. Information We Collect</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong>Account Information:</strong> When you register, we collect your email address and authentication credentials via our third-party authentication provider (Supabase).
                    </li>
                    <li>
                        <strong>User Content:</strong> We collect and store the audio recordings, videos, meeting metadata (titles, dates), and generated transcripts/summaries that you create using the Service.
                    </li>
                    <li>
                        <strong>API Credentials:</strong> We securely store encrypted versions of external API keys (e.g., Google Gemini API keys) that you provide to enable AI features.
                    </li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">3. How We Use Your Information</h2>
                <p>We use your information strictly to provide and improve the functionality of the Service:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>To authenticate your identity and secure your account.</li>
                    <li>To process audio recordings into transcripts using the API credentials you provide.</li>
                    <li>To store and retrieve your meeting history.</li>
                </ul>
                <p className="font-semibold mt-4">
                    <strong>We do NOT use your audio recordings or transcripts to train our own artificial intelligence models.</strong>
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">4. Third-Party Processors</h2>
                <p>
                    We utilize third-party services to operate the application. Your data may be processed by:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong>Supabase:</strong> For database hosting, authentication, and file storage.
                    </li>
                    <li>
                        <strong>Google (Gemini API):</strong> For generating transcripts and summaries. Data sent to the Gemini API is subject to Google's data processing terms.
                    </li>
                </ul>
                <p>
                    When you use AI features, your content is sent directly to the AI provider using your own API key. We act as an interface and transmission layer.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">5. Data Retention and Security</h2>
                <p>
                    All user data is stored in secure, encrypted databases.
                </p>
                <p>
                    You retain full ownership of your data. You may delete your recordings, transcripts, and account at any time via the application settings, which will permanently remove this data from our servers.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">6. Compliance with Recording Laws</h2>
                <p className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                    <strong>Important Legal Notice:</strong> Laws regarding the recording of conversations vary by jurisdiction. In many places, it is illegal to record a conversation without the consent of all parties (Two-Party Consent laws).
                </p>
                <p>
                    You are solely responsible for ensuring that you comply with all applicable local, state, and federal laws regarding the recording of conversations. By using Lumen Notes, you represent and warrant that you have obtained all necessary consents from meeting participants before recording.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">7. Changes to This Policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">8. Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us via the support channels provided in the application.
                </p>
            </section>
        </div>
    )
}
