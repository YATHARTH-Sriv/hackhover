"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="empty-page">
      <p className="eyebrow">A pause</p>
      <h1>Something interrupted this page.</h1>
      <p>Your saved visits are still in your local notebook. Try loading it again.</p>
      <button className="button button-primary" type="button" onClick={reset}>Try again</button>
    </main>
  );
}
