import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.header
      className="navbar"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="container navbar__inner">
        <Link to="/" className="brand" aria-label="Civil BuildCalc home">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path d="M3 20h18M5 20V10l7-6 7 6v10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M9 20v-5h6v5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <span className="brand__text">
            Civil<span className="brand__accent">BuildCalc</span>
          </span>
        </Link>

        <nav className="navbar__links" aria-label="Main navigation">
          <NavLink to="/" end className="navbar__link">Home</NavLink>
          <NavLink to="/#tools" className="navbar__link">Tools</NavLink>
        </nav>
      </div>
    </motion.header>
  );
}
