import React, { useEffect, useState } from 'react';
import './TransferTicker.css';

const mockTransfers = [
  {
    title: "Arsenal sign striker from Ligue 1",
    link: "https://www.theguardian.com/football",
    description: "Arsenal have secured a deal for a promising striker from Ligue 1."
  },
  {
    title: "Chelsea completes €60M midfielder move",
    link: "https://www.theguardian.com/football",
    description: "Chelsea have completed a big-money signing to strengthen their midfield."
  },
  {
    title: "Liverpool eye Bundesliga defender",
    link: "https://www.theguardian.com/football",
    description: "Liverpool are scouting a potential defensive reinforcement from the Bundesliga."
  }
];

function TransferTicker() {
  const [transfers, setTransfers] = useState(mockTransfers);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRSS() {
      try {
        const res = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.theguardian.com/football/rss"));
        if (!res.ok) throw new Error("Failed to fetch feed");

        const data = await res.json();
        const parser = new DOMParser();
        const xml = parser.parseFromString(data.contents, "text/xml");

        const items = Array.from(xml.querySelectorAll("item")).map(item => ({
          title: item.querySelector("title")?.textContent || "No Title",
          link: item.querySelector("link")?.textContent || "https://www.theguardian.com/football",
          description: item.querySelector("description")?.textContent || "No description available"
        }));

        if (items.length > 0) {
          setTransfers(items);
        } else {
          throw new Error("No valid items");
        }
      } catch (err) {
        console.warn("Using mock data:", err.message);
        setError("⚠️ Failed to load news. Showing fallback.");
        setTransfers(mockTransfers);
      }
    }

    fetchRSS();
  }, []);

  return (
    <>
      <div className="ticker-container">
        <div className="ticker-text">
          {(error ? mockTransfers : transfers).map((item, idx) => (
            <span key={idx} className="ticker-item" onClick={() => setModal(item)}>
              📰 {item.title}
            </span>
          ))}
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{modal.title}</h3>
            <div className="modal-description" dangerouslySetInnerHTML={{ __html: modal.description }} />
            <a href={modal.link} target="_blank" rel="noreferrer" className="read-more-link">
              🔗 Read Full Article
            </a>
            <button className="close-btn" onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default TransferTicker;
