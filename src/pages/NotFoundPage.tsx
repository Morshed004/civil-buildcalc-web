import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="page-main">
      <div className="container text-center">
        <h1 className="page-header__title">Page not found</h1>
        <p className="text-muted">The calculator you are looking for does not exist.</p>
        <Link to="/" className="btn btn--primary">Back to all tools</Link>
      </div>
    </main>
  );
}
