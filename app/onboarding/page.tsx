const sections = [
  "Personal and contact details",
  "Education and work authorization",
  "Resume upload and parsing",
  "Writing samples for tone anchoring",
];

export default function OnboardingPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Onboarding</p>
          <h1 className="page-title">Build the profile once, reuse it everywhere.</h1>
          <p className="page-copy">
            The onboarding flow should collect enough structured information to
            make autofill reliable and drafts believable without turning setup
            into another long form.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="content-card">
          <p className="eyebrow">What belongs here</p>
          <ul className="feature-list">
            {sections.map((section) => (
              <li key={section}>{section}</li>
            ))}
          </ul>
        </div>

        <div className="content-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Form skeleton</p>
              <h2>Fields to implement first</h2>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Full name
              <input placeholder="Valentina Pagliuca" />
            </label>
            <label>
              Email
              <input placeholder="valentinap@uchicago.edu" />
            </label>
            <label>
              School
              <input placeholder="University of Chicago" />
            </label>
            <label>
              Graduation
              <input placeholder="June 2026" />
            </label>
            <label className="full-width">
              LinkedIn
              <input placeholder="https://linkedin.com/in/..." />
            </label>
            <label className="full-width">
              Resume upload
              <div className="upload-placeholder">PDF parser slot</div>
            </label>
            <label className="full-width">
              Writing samples
              <div className="upload-placeholder">
                Store 2-3 past cover letters or strong application answers
              </div>
            </label>
          </div>
        </div>
      </section>
    </main>
  );
}
