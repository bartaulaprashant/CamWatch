import { useEffect, useState } from "react";
import { Activity, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { eventAPI } from "../services/api";

const PAGE_SIZE = 12;

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export default function EventHistory() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    eventAPI.list(PAGE_SIZE, offset)
      .then((data) => {
        setEvents(data.events);
        setTotal(data.total);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [offset]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="dashboard">
      <section className="page-heading">
        <div>
          <span className="eyebrow">CAMWATCH WORKSPACE</span>
          <h1>Event History</h1>
          <p>Review motion events captured by CamWatch.</p>
        </div>
      </section>

      {error && <div className="stream-error">{error}</div>}

      {loading ? (
        <div className="settings-panel">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="settings-panel event-empty">
          <Activity size={28} />
          <strong>No motion events</strong>
          <span>Captured activity will appear here.</span>
        </div>
      ) : (
        <div className="event-history-grid">
          {events.map((event) => (
            <article className="event-history-card" key={event.id}>
              <a href={eventAPI.imageUrl(event.id)} target="_blank" rel="noreferrer">
                <img
                  src={eventAPI.imageUrl(event.id)}
                  alt={event.description || "Motion event snapshot"}
                  loading="lazy"
                  onError={(element) => { element.currentTarget.style.display = "none"; }}
                />
              </a>
              <div className="event-history-content">
                <div className="event-history-title">
                  <span className="event-icon"><Activity size={16} /></span>
                  <strong>{event.description || "Motion detected"}</strong>
                </div>
                <span>Camera {event.camera_id} · EVT-{String(event.id).padStart(4, "0")}</span>
                <time>{formatDate(event.created_at)}</time>
              </div>
            </article>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="event-pagination">
          <button
            className="control-button"
            aria-label="Previous page"
            disabled={offset === 0}
            onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}
          ><ChevronLeft size={16} /></button>
          <span>Page {page} of {pageCount}</span>
          <button
            className="control-button"
            aria-label="Next page"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset((value) => value + PAGE_SIZE)}
          ><ChevronRight size={16} /></button>
        </div>
      )}
    </main>
  );
}
