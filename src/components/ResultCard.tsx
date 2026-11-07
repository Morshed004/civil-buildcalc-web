import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface ResultCardProps {
  title: string;
  children: ReactNode;
  highlight?: boolean;
}

export function ResultCard({ title, children, highlight = false }: ResultCardProps) {
  return (
    <motion.div
      className={`result-card ${highlight ? "result-card--highlight" : ""}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h3 className="result-card__title">{title}</h3>
      <div className="result-card__body">{children}</div>
    </motion.div>
  );
}

interface ResultRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

export function ResultRow({ label, value, emphasis = false }: ResultRowProps) {
  return (
    <div className={`result-row ${emphasis ? "result-row--emphasis" : ""}`}>
      <span className="result-row__label">{label}</span>
      <span className="result-row__value">{value}</span>
    </div>
  );
}

interface ResultsPlaceholderProps {
  message: string;
}

export function ResultsPlaceholder({ message }: ResultsPlaceholderProps) {
  return (
    <div className="results-placeholder">
      <p>{message}</p>
    </div>
  );
}
