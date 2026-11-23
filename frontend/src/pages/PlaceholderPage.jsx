
export default function PlaceholderPage({ title, description }) {
  return (
    <main className="dashboard">
      <section className="page-heading">
        <div>
          <span className="eyebrow">CAMWATCH WORKSPACE</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>
    </main>
  );
}
