import LegalPage from './LegalPage.jsx'

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="July 20, 2026">
      <div className="legal-page__section">
        <h2>1. Introduction</h2>
        <p>
          KumoCoders ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
        </p>
        <p>
          By using the KumoCoders Platform, you agree to the collection and use of information in accordance with this policy.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>2. Information We Collect</h2>
        <h3>Personal Information</h3>
        <p>
          We may collect personally identifiable information such as your name, email address, and username when you register for an account, subscribe to our newsletter, or participate in community discussions.
        </p>
        <h3>Usage Data</h3>
        <p>
          We automatically collect information about how you interact with our platform, including pages visited, time spent, links clicked, and other diagnostic data. This helps us improve our services.
        </p>
        <h3>Cookies and Tracking</h3>
        <p>
          We use cookies and similar tracking technologies to track activity on our platform and store certain information. You can control cookie preferences in your browser settings. See our <a href="/cookies" className="underline">Cookie Policy</a> for more details.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>3. How We Use Your Information</h2>
        <p>We use the collected information for various purposes:</p>
        <ul>
          <li>To provide, operate, and maintain our platform</li>
          <li>To improve, personalize, and expand our services</li>
          <li>To communicate with you, including for customer support</li>
          <li>To send you updates, newsletters, and marketing materials (with your consent)</li>
          <li>To detect, prevent, and address technical issues and abuse</li>
        </ul>
      </div>

      <div className="legal-page__section">
        <h2>4. Data Sharing and Disclosure</h2>
        <p>
          We do not sell your personal information. We may share your data in the following circumstances:
        </p>
        <ul>
          <li><strong>Service Providers:</strong> With third-party vendors who help us operate our platform</li>
          <li><strong>Legal Requirements:</strong> If required by law or in response to valid legal requests</li>
          <li><strong>Protection of Rights:</strong> To protect the rights, property, or safety of KumoCoders, our users, or others</li>
        </ul>
      </div>

      <div className="legal-page__section">
        <h2>5. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>6. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul>
          <li>Access, update, or delete your personal information</li>
          <li>Object to or restrict processing of your data</li>
          <li>Data portability</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p>
          To exercise these rights, please contact us through our community platform or at the email address provided on our website.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>7. Third-Party Links</h2>
        <p>
          Our platform may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review their privacy policies before providing any personal information.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>8. Children's Privacy</h2>
        <p>
          Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal data, we will take steps to delete it.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>10. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please reach out to us through our community platform at <a href="/community" className="underline">/community</a> or contact us via the KumoCoders GitHub organization.
        </p>
      </div>
    </LegalPage>
  )
}
