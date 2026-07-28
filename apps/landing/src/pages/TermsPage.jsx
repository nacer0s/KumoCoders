import LegalPage from './LegalPage.jsx'

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="July 20, 2026">
      <div className="legal-page__section">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the KumoCoders Platform ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to all the terms, you may not access or use the Platform.
        </p>
        <p>
          These terms apply to all visitors, users, and others who access or use the Platform.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>2. Description of Service</h2>
        <p>
          KumoCoders provides a community-driven platform for developers, including but not limited to:
        </p>
        <ul>
          <li>Community discussion forums and collaborative spaces</li>
          <li>Documentation and knowledge base (Wiki)</li>
          <li>Project showcase and portfolio hosting</li>
          <li>Blog and content publishing</li>
          <li>Open-source project collaboration</li>
        </ul>
      </div>

      <div className="legal-page__section">
        <h2>3. User Accounts</h2>
        <p>
          When you create an account on our Platform, you must provide accurate and complete information. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
        </p>
        <p>
          You must notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts at our sole discretion.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>4. User Conduct</h2>
        <p>By using the Platform, you agree not to:</p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Impersonate any person or entity or misrepresent your affiliation</li>
          <li>Post or transmit any harmful, offensive, or inappropriate content</li>
          <li>Interfere with or disrupt the Platform or servers</li>
          <li>Attempt to gain unauthorized access to any part of the Platform</li>
          <li>Use the Platform for any illegal or unauthorized purpose</li>
        </ul>
      </div>

      <div className="legal-page__section">
        <h2>5. Content Ownership and Licensing</h2>
        <h3>Your Content</h3>
        <p>
          You retain ownership of any content you submit, post, or display on the Platform. By submitting content, you grant KumoCoders a non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content on the Platform for the purpose of operating and improving our services.
        </p>
        <h3>Platform Content</h3>
        <p>
          The KumoCoders name, logo, and platform design are owned by KumoCoders. Unless otherwise stated, the Platform and its original content are protected by copyright, trademark, and other intellectual property laws.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>6. Open Source Contributions</h2>
        <p>
          Contributions to KumoCoders open-source projects are governed by the respective project licenses. By contributing, you agree that your contributions are made under the terms of the applicable open-source license.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>7. Limitation of Liability</h2>
        <p>
          KumoCoders and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. The Platform is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>8. Termination</h2>
        <p>
          We reserve the right to terminate or suspend your account and access to the Platform at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will provide notice of material changes through the Platform. Your continued use of the Platform after such modifications constitutes your acceptance of the updated Terms.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>10. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of Morocco. Any disputes arising from these Terms shall be resolved in the courts of Casablanca, Morocco.
        </p>
      </div>

      <div className="legal-page__section">
        <h2>11. Contact</h2>
        <p>
          For any questions about these Terms, please reach out through our community platform at <a href="/community" className="underline">/community</a>.
        </p>
      </div>
    </LegalPage>
  )
}
