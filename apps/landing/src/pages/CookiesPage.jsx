import LegalPage from './LegalPage.jsx'

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" lastUpdated="July 20, 2026">
      <div className="legal-page__section">
        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work efficiently and provide information to the website owners.
        </p>
        <p>
          This Cookie Policy explains what cookies we use, why we use them, and how you can control them.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>2. How We Use Cookies</h2>
        <p>We use cookies for the following purposes:</p>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for the Platform to function properly, including authentication and security</li>
          <li><strong>Preference Cookies:</strong> Remember your settings and preferences, such as theme selection (dark/light mode)</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our Platform, so we can improve it</li>
          <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser, used to maintain your session</li>
        </ul>
      </div>

      <div className="legal-page__section">
        <h2>3. Types of Cookies We Use</h2>
        <h3>First-Party Cookies</h3>
        <p>
          These are cookies set by KumoCoders directly. They are used for authentication (storing your login session), remembering your theme preference (dark/light mode), and maintaining your community session.
        </p>
        <h3>Third-Party Cookies</h3>
        <p>
          We do not currently use third-party tracking cookies. If we add any third-party services in the future, we will update this policy.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>4. Your Cookie Choices</h2>
        <p>You have several options to control cookies:</p>
        <ul>
          <li><strong>Browser Settings:</strong> Most browsers allow you to control cookies through their settings. You can choose to block all cookies, delete existing cookies, or receive a notification when a cookie is set.</li>
          <li><strong>Essential Cookies:</strong> Please note that blocking essential cookies may affect the functionality of our Platform, and you may not be able to access certain features.</li>
          <li><strong>Theme Preference:</strong> The only persistent cookie we set is for your theme preference (dark/light mode). You can clear this at any time through your browser settings.</li>
        </ul>
      </div>

      <div className="legal-page__section">
        <h2>5. Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>6. Contact Us</h2>
        <p>
          If you have any questions about our use of cookies, please reach out through our community platform at <a href="/community" className="underline">/community</a>.
        </p>
      </div>
    </LegalPage>
  )
}
