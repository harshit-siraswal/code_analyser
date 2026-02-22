import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>This route does not exist yet.</p>
        <Link className="inline-link" to="/problems">
          Go to problems
        </Link>
      </section>
    </main>
  );
}

