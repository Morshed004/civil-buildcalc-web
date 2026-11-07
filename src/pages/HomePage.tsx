import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TOOLS, type ToolDefinition } from "@/lib/tools";
import { ToolIcon, ArrowRightIcon, SearchIcon } from "@/components/icons";

function matchesQuery(tool: ToolDefinition, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  const haystack = [tool.title, tool.description, ...tool.keywords].join(" ").toLowerCase();
  return q.split(/\s+/).every((term) => haystack.includes(term));
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function HomePage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => TOOLS.filter((t) => matchesQuery(t, query)), [query]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <motion.h1
            className="hero__title"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Civil <span>BuildCalc</span>
          </motion.h1>
          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            Fast, accurate construction calculations for concrete volume, reinforcement steel,
            piles, beams and columns, with rod lapping built in.
          </motion.p>

          <motion.div
            className="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14 }}
          >
            <span className="search__icon"><SearchIcon /></span>
            <input
              type="search"
              className="search__input"
              placeholder="Search tools, e.g. beam, rod, pile"
              aria-label="Search calculation tools"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </motion.div>
        </div>
      </section>

      <main id="tools">
        <div className="container">
          <div className="section-header">
            <h2 className="section-header__title">Calculation tools</h2>
            <span className="section-header__count">
              {filtered.length} of {TOOLS.length} tools
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              No tools match “{query}”. Try a different keyword such as concrete or steel.
            </div>
          ) : (
            <motion.div
              className="tools-grid"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {filtered.map((tool) => (
                <motion.div key={tool.id} variants={item}>
                  <Link to={tool.path} className="tool-card" aria-label={`Open ${tool.title}`}>
                    <span className="tool-card__icon">
                      <ToolIcon name={tool.icon} />
                    </span>
                    <h3 className="tool-card__title">{tool.title}</h3>
                    <p className="tool-card__desc">{tool.description}</p>
                    <span className="tool-card__cta">
                      Open calculator <ArrowRightIcon size={14} />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}
