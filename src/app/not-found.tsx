import Link from "next/link";

export default function NotFound() {
  return (
    <main className="empty-page">
      <p className="eyebrow">Place not found</p>
      <h1>This place isn’t in your notebook.</h1>
      <p>Go back and choose a place you’ve already added.</p>
      <Link className="button button-primary" href="/">Back to places</Link>
    </main>
  );
}
