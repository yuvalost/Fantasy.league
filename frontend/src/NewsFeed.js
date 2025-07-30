import React, { useEffect, useState } from 'react';
import './NewsFeed.css';

function NewsFeed() {
  const [news, setNews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("https://api.codetabs.com/v1/proxy/?quest=https://www.theguardian.com/football/rss");
        if (!res.ok) throw new Error("Failed to fetch");

        const xmlText = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "text/xml");

        const items = Array.from(xml.querySelectorAll("item")).map(item => ({
          title: item.querySelector("title")?.textContent,
          link: item.querySelector("link")?.textContent,
          pubDate: item.querySelector("pubDate")?.textContent,
          description: item.querySelector("description")?.textContent
        }));

        if (items.length > 0) {
          setNews(items.slice(0, 5)); // Show only latest 5
          setError(null);
        } else {
          throw new Error("No news items found");
        }
      } catch (err) {
        console.error("News fetch error:", err.message);
        setError("⚠️ Failed to fetch news");
      }
    }

    fetchNews(); // Initial fetch

    const interval = setInterval(fetchNews, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="newsfeed-container">
      <h2>Latest Premier League News</h2>
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <ul className="news-list">
          {news.map((item, index) => (
            <li key={index} className="news-item">
              <a href={item.link} target="_blank" rel="noreferrer">
                <strong>{item.title}</strong>
              </a>
              <p dangerouslySetInnerHTML={{ __html: item.description }}></p>
              <small>{new Date(item.pubDate).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NewsFeed;
