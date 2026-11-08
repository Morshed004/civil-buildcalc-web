export function Footer() {
  return (
    <footer className="footer" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", padding: "40px 0 0", marginTop: "20px" }}>
      <div className="container footer__inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "30px", paddingBottom: "30px" }}>
        
        {/* ব্র্যান্ড সেকশন */}
        <div className="footer__brand" style={{ flex: "1 1 280px" }}>
          <span className="brand__text" style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
            Civil<span className="brand__accent">BuildCalc</span>
          </span>
          <p className="footer__tagline" style={{ marginTop: "8px", opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.5" }}>
            Practical calculation tools for civil engineers, contractors and students.
          </p>
        </div>

        {/* নোট সেকশন */}
        <div className="footer__col" style={{ flex: "1 1 280px" }}>
          <h4 className="footer__heading" style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "8px" }}>Note</h4>
          <p className="footer__note" style={{ opacity: 0.8, fontSize: "0.9rem", lineHeight: "1.5" }}>
            Results are estimates. Verify all quantities against applicable design codes and
            site drawings before ordering materials.
          </p>
        </div>
      </div>

      {/* ফুটারের নিচের অংশ (কপিরাইট এবং ডেভেলপার ইনফো) */}
      <div className="footer__bottom" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", padding: "20px 0", marginTop: "20px" }}>
        <div className="container footer__bottom-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", fontSize: "0.9rem" }}>
          
          <span>© {new Date().getFullYear()} Civil BuildCalc. All rights reserved.</span>
          
          <span className="footer__developer" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            Developed by <strong style={{ fontWeight: "600" }}>Golam Morshed</strong> |{" "}
            <a 
              href="https://golam-morshed-portfolio.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              Portfolio
            </a>{" "}
            |{" "}
            <a 
              href="https://github.com/Morshed004" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              GitHub
            </a>
          </span>

        </div>
      </div>
    </footer>
  );
}