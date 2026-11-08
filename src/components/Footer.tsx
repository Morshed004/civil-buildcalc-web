import { useState } from "react";
import { Link } from "react-router-dom";
import { TOOLS } from "@/lib/tools";

export function Footer() {
  const [showAll, setShowAll] = useState(false);

  // প্রথম ৫টি টুলস আলাদা করা
  const displayedTools = showAll ? TOOLS : TOOLS.slice(0, 5);
  const hasMoreTools = TOOLS.length > 5;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="brand__text">
            Civil<span className="brand__accent">BuildCalc</span>
          </span>
          <p className="footer__tagline">
            Practical calculation tools for civil engineers, contractors and students.
          </p>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Calculators</h4>
          <ul className="footer__list">
            {displayedTools.map((tool) => (
              <li key={tool.id}>
                <Link to={tool.path}>{tool.title}</Link>
              </li>
            ))}
          </ul>

          {hasMoreTools && (
            <button
              onClick={() => {
                if (showAll) {
                  // যদি 'Show less' করা হয়, তবে পেজের উপরের দিকে স্ক্রোল করবে
                  scrollToTop();
                }
                setShowAll(!showAll);
              }}
              className="footer__view-all-btn"
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                padding: "4px 0",
                marginTop: "8px",
                textDecoration: "underline",
                fontSize: "0.9rem",
              }}
            >
              {showAll ? "Show less" : `View all (${TOOLS.length})`}
            </button>
          )}
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Note</h4>
          <p className="footer__note">
            Results are estimates. Verify all quantities against applicable design codes and
            site drawings before ordering materials.
          </p>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <span>© {new Date().getFullYear()} Civil BuildCalc. All rights reserved.</span>
          <span className="footer__developer">
            Developed by <strong>Golam Morshed</strong> |{" "}
            <a href="YOUR_PORTFOLIO_LINK_HERE" target="_blank" rel="noopener noreferrer">
              Portfolio
            </a>{" "}
            |{" "}
            <a href="YOUR_GITHUB_LINK_HERE" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}