
const Home = () => (
  <div className="home-landing pro-home-bg">
    <header className="hero-section pro-hero">
      <div className="container text-center">
        <h1 className="display-1 fw-bold gradient-text mb-4" style={{ letterSpacing: '2px' }}>BookVerse</h1>
        <p className="lead fs-3 mb-5" style={{ maxWidth: '600px', margin: '0 auto', color: '#e0e0e0' }}>
          Elevate your reading experience. Discover, explore, and get personalized book recommendations from a vibrant community of book lovers.
        </p>
  <h2 className="fw-bold mb-3 gradient-text" style={{ fontSize: '2.2rem' }}>Ready to find your next great read?</h2>
  <a href="/recommendation" className="btn btn-lg btn-warning px-5 py-3 pro-cta-btn">Start Your Book Journey</a>
      </div>
    </header>
    <section className="features-section pro-features mt-5">
      <div className="container">
        <div className="row text-center">
          <div className="col-md-4 mb-4">
            <div className="feature-card p-4 rounded shadow pro-feature-card website-feature-card">
                <span className="feature-icon" style={{ display: 'block', marginBottom: '18px' }}>
                  {/* Professional search SVG icon */}
                  <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="12" stroke="#ff6a00" strokeWidth="3"/><line x1="34" y1="34" x2="44" y2="44" stroke="#ff6a00" strokeWidth="3" strokeLinecap="round"/></svg>
                </span>
                <h3 className="fw-bold mb-3">Smart Book Search</h3>
                <p className="fs-5">Find books instantly with our intelligent search and recommendation engine tailored to your preferences.</p>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="feature-card p-4 rounded shadow pro-feature-card website-feature-card">
                <span className="feature-icon" style={{ display: 'block', marginBottom: '18px' }}>
                  {/* Professional genre SVG icon */}
                  <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="12" width="32" height="24" rx="4" stroke="#43cea2" strokeWidth="3"/><line x1="16" y1="20" x2="32" y2="20" stroke="#43cea2" strokeWidth="2"/><line x1="16" y1="28" x2="32" y2="28" stroke="#43cea2" strokeWidth="2"/></svg>
                </span>
                <h3 className="fw-bold mb-3">Genre Explorer</h3>
                <p className="fs-5">Dive into new genres and discover books you never knew you'd love, all in one place.</p>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="feature-card p-4 rounded shadow pro-feature-card website-feature-card">
                <span className="feature-icon" style={{ display: 'block', marginBottom: '18px' }}>
                  {/* Open book SVG icon for Personal Library with appropriate colors */}
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 36V14C8 12.8954 8.89543 12 10 12H22C23.1046 12 24 12.8954 24 14V36" fill="#f8f4e3" stroke="#c2b280" strokeWidth="2"/>
                    <path d="M40 36V14C40 12.8954 39.1046 12 38 12H26C24.8954 12 24 12.8954 24 14V36" fill="#f8f4e3" stroke="#c2b280" strokeWidth="2"/>
                    <line x1="24" y1="12" x2="24" y2="36" stroke="#c2b280" strokeWidth="2"/>
                    <path d="M8 36C8 37.1046 8.89543 38 10 38H22C23.1046 38 24 37.1046 24 36" fill="#f8f4e3" stroke="#c2b280" strokeWidth="2"/>
                    <path d="M40 36C40 37.1046 39.1046 38 38 38H26C24.8954 38 24 37.1046 24 36" fill="#f8f4e3" stroke="#c2b280" strokeWidth="2"/>
                    <rect x="8" y="12" width="16" height="26" rx="3" fill="#ffe4b5" stroke="#c2b280" strokeWidth="1"/>
                    <rect x="24" y="12" width="16" height="26" rx="3" fill="#ffe4b5" stroke="#c2b280" strokeWidth="1"/>
                    <line x1="14" y1="20" x2="22" y2="20" stroke="#c2b280" strokeWidth="1.5"/>
                    <line x1="14" y1="24" x2="22" y2="24" stroke="#c2b280" strokeWidth="1.5"/>
                    <line x1="14" y1="28" x2="22" y2="28" stroke="#c2b280" strokeWidth="1.5"/>
                    <line x1="26" y1="20" x2="34" y2="20" stroke="#c2b280" strokeWidth="1.5"/>
                    <line x1="26" y1="24" x2="34" y2="24" stroke="#c2b280" strokeWidth="1.5"/>
                    <line x1="26" y1="28" x2="34" y2="28" stroke="#c2b280" strokeWidth="1.5"/>
                  </svg>
                </span>
                <h3 className="fw-bold mb-3">Personal Library</h3>
                <p className="fs-5">Save your favourite books, build your personal reading list, and keep track of your discoveries.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default Home;
