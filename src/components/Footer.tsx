import { Link } from "react-router-dom";
import { TOOLS } from "@/lib/tools";

export function Footer() {
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
            {TOOLS.map((tool) => (
              <li key={tool.id}>
                <Link to={tool.path}>{tool.title}</Link>
              </li>
            ))}
          </ul>
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
        <div className="container">© {new Date().getFullYear()} Civil BuildCalc. All rights reserved.</div>
      </div>
    </footer>
  );
}
