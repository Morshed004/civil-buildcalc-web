import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeftIcon } from "./icons";

interface CalculatorShellProps {
  title: string;
  description: string;
  form: ReactNode;
  results: ReactNode;
  errors: string[];
  onCalculate: () => void;
  onReset: () => void;
}

export function CalculatorShell({
  title,
  description,
  form,
  results,
  errors,
  onCalculate,
  onReset,
}: CalculatorShellProps) {
  return (
    <main className="page-main" style={{ marginTop: "15px" }}>
      <div className="container">
        <Link to="/" className="back-link">
          <ArrowLeftIcon /> Back to all tools
        </Link>

        <motion.header
          className="page-header"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="page-header__title">{title}</h1>
          <p className="page-header__desc">{description}</p>
        </motion.header>

        <div className="calc-layout">
          <section className="card calc-form" aria-label="Inputs">
            <div className="calc-form__body">{form}</div>

            {errors.length > 0 && (
              <div className="alert alert--error" role="alert">
                <strong>Please fix the following:</strong>
                <ul>
                  {errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="calc-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={onReset}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={onCalculate}
              >
                Calculate
              </button>
            </div>
          </section>

          <section
            className="calc-results"
            aria-label="Results"
            aria-live="polite"
          >
            {results}
          </section>
        </div>
      </div>
    </main>
  );
}
