import { useState } from 'react'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState('cloud')

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
    }
  }

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
          <line x1="6" y1="6" x2="6.01" y2="6"></line>
          <line x1="6" y1="18" x2="6.01" y2="18"></line>
        </svg>
      ),
      title: 'High-Performance Backend',
      desc: 'Built on .NET Clean Architecture, optimized for extreme throughput, low latency, and enterprise-grade reliability.'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      ),
      title: 'Global Edge Cloud',
      desc: 'Decoupled frontend deployed worldwide on high-speed edge networks with sub-millisecond response times.'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      title: 'Enterprise Security',
      desc: 'Zero-trust architecture, automated JWT authentication, strict authorization policies, and cryptographic security.'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      ),
      title: 'Modern API First',
      desc: 'REST & GraphQL ready endpoints with end-to-end type safety, structured documentation, and modular contracts.'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      ),
      title: 'Domain-Driven Design',
      desc: 'Separation of concerns using Domain, Application, Infrastructure, and API layers to scale effortlessly.'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
      ),
      title: 'Instant Scalability',
      desc: 'Auto-scaling stateless services with resilient connection pooling and optimized database indexing.'
    }
  ]

  return (
    <div className="app-wrapper">
      {/* Navigation */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 19.5h20L12 2zm0 4.5l6.5 11.5H5.5L12 6.5z" />
            </svg>
          </div>
          <span className="brand-name">Affinovas</span>
          <span className="domain-pill">affinovas.online</span>
        </div>

        <nav className="nav-links">
          <a href="#features" className="nav-link">Platform</a>
          <a href="#architecture" className="nav-link">Architecture</a>
          <a href="https://github.com/affinovas/affinovas-web" target="_blank" rel="noreferrer" className="nav-link">GitHub</a>
          <a href="#contact" className="cta-btn">Connect</a>
        </nav>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="badge-wrapper">
            <span className="status-dot"></span>
            <span>affinovas.online is live and operational</span>
          </div>

          <h1 className="hero-title">
            Architecting Tomorrow's <br />
            <span className="gradient-text">Intelligent Platforms</span>
          </h1>

          <p className="hero-sub">
            Affinovas is an enterprise digital ecosystem engineered for resilience,
            scalability, and modern cloud performance. Powering next-gen web applications
            and intelligent distributed systems.
          </p>

          <div className="hero-actions">
            <a href="#features" className="primary-btn">Explore Platform</a>
            <a href="https://github.com/affinovas/affinovas-web" target="_blank" rel="noreferrer" className="secondary-btn">
              View Repository
            </a>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features">
          <div className="section-header">
            <p className="section-tag">Capabilities</p>
            <h2 className="section-title">Engineered for Absolute Performance</h2>
          </div>

          <div className="cards-grid">
            {features.map((item, idx) => (
              <div key={idx} className="feature-card">
                <div className="card-icon">{item.icon}</div>
                <h3 className="card-title">{item.title}</h3>
                <p className="card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* System Architecture */}
        <section id="architecture" className="arch-box">
          <div className="arch-header">
            <div>
              <p className="section-tag">System Blueprints</p>
              <h2 className="arch-title">Clean Modular Architecture</h2>
            </div>
            <div className="arch-badge">Ready for Production</div>
          </div>

          <div className="arch-items">
            <div className="arch-item">
              <div className="arch-item-title">FE: Modern Web Client</div>
              <div className="arch-item-detail">Vite + React fast-refresh SPA connected to edge CDN.</div>
            </div>
            <div className="arch-item">
              <div className="arch-item-title">BE: Affinovas.Api</div>
              <div className="arch-item-detail">ASP.NET Core REST API with dependency injection & JWT security.</div>
            </div>
            <div className="arch-item">
              <div className="arch-item-title">Affinovas.Application</div>
              <div className="arch-item-detail">CQRS, core domain workflows, interfaces, and business rules.</div>
            </div>
            <div className="arch-item">
              <div className="arch-item-title">Affinovas.Infrastructure</div>
              <div className="arch-item-detail">SQL connection factories, data persistence, and token hashing.</div>
            </div>
          </div>
        </section>

        {/* Contact / Updates */}
        <section id="contact" className="cta-banner">
          <h2>Connect With Affinovas</h2>
          <p>
            Stay updated as we roll out new modules, intelligent automation, and platform upgrades.
          </p>

          {submitted ? (
            <div style={{ color: '#34d399', fontWeight: 600, fontSize: '1.1rem' }}>
              ✓ Thank you! We will be in touch with updates.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="banner-input-wrap">
              <input
                id="email-input"
                type="email"
                placeholder="Enter your email"
                className="banner-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button id="subscribe-btn" type="submit" className="cta-btn">
                Notify Me
              </button>
            </form>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} Affinovas. All rights reserved. • Hosted on{' '}
          <a href="https://affinovas.online" target="_blank" rel="noreferrer">affinovas.online</a>
        </p>
      </footer>
    </div>
  )
}

export default App
