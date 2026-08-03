import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home">
      <nav className="home-nav">
        <div className="home-logo">OpsDesk</div>
        <div className="home-nav-links">
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-btn">Get Started</Link>
        </div>
      </nav>

      <section className="hero">
        <h1>Incidents tracked. SLAs kept. Nothing falls through the cracks.</h1>
        <p className="hero-sub">
          OpsDesk is a smart incident and SLA management system — turn scattered complaints
          into trackable tickets, with automatic priority detection and deadline accountability.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="nav-btn large">Create Free Account</Link>
          <Link to="/login" className="nav-link large">I already have an account</Link>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🎫</div>
          <h3>Smart Ticketing</h3>
          <p>Every complaint becomes a tracked ticket — auto-classified by category and priority, no manual guesswork.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⏱️</div>
          <h3>Automatic SLA Tracking</h3>
          <p>Deadlines are calculated the moment a ticket is created, based on urgency — with live on-track, at-risk, and breached status.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔁</div>
          <h3>Controlled Lifecycle</h3>
          <p>Tickets move through a strict Open → In Progress → Resolved → Closed flow, so nothing gets skipped or lost.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🧭</div>
          <h3>Role-Based Access</h3>
          <p>Reporters, Engineers, Managers, and Admins each see exactly what they need — nothing more, nothing less.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>Duplicate Detection</h3>
          <p>Before submitting, reporters are warned if a similar issue was already raised — cutting down on repeat tickets.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Secure by Design</h3>
          <p>Password hashing, signed tokens, and backend-enforced permissions — never just a hidden button.</p>
        </div>
      </section>

      <section className="who">
        <h2>Who uses OpsDesk?</h2>
        <div className="who-grid">
          <div className="who-card"><strong>IT Departments</strong><p>Track hardware, network, and software complaints across an organization.</p></div>
          <div className="who-card"><strong>Colleges &amp; Universities</strong><p>Manage facility, lab, and infrastructure issues raised by students and staff.</p></div>
          <div className="who-card"><strong>Hospitals</strong><p>Keep equipment and facility incidents accountable to strict resolution times.</p></div>
          <div className="who-card"><strong>Any Growing Team</strong><p>Replace scattered chat messages with a single source of truth for issues.</p></div>
        </div>
      </section>

      <footer className="home-footer">
        <p>OpsDesk — built as a learning project. MERN stack, full RBAC, real SLA logic.</p>
      </footer>
    </div>
  );
}