
export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span>{title}</span>
        <div className={`stat-icon ${accent}`}>
          <Icon size={19} />
        </div>
      </div>

      <h2>{value}</h2>
      <p>{description}</p>
    </div>
  );
}
