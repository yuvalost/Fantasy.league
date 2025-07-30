import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function HomeNews() {
  const [news, setNews] = useState([]);
  const [transfers, setTransfers] = useState([]);
  
  useEffect(() => {
    async function fetchFeeds() {
      // Mock plugins: replace with real RSS-to-JSON or API in production
      const resNews = await fetch('/api/news'); 
      const resTrans = await fetch('/api/transfers');
      const dataNews = await resNews.json();
      const dataTrans = await resTrans.json();
      setNews(dataNews);
      setTransfers(dataTrans);
    }
    fetchFeeds();
  }, []);

  return (
    <div className="home-news-container">
      <h2>Premier League News</h2>
      <ul>
        {news.map((item, idx) => (
          <li key={idx}><a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a></li>
        ))}
      </ul>

      <h2>Transfer Updates</h2>
      <ul>
        {transfers.map((item, idx) => (
          <li key={idx}><a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a></li>
        ))}
      </ul>

      <div className="nav-links">
        <Link to="/players?team=Arsenal">Players</Link> |{' '}
        <Link to="/fixtures">Fixtures</Link> |{' '}
        <Link to="/my-team">My Team</Link>
      </div>
    </div>
  );
}

export default HomeNews;
