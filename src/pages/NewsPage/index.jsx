import { useEffect, useState } from "react";
import { fetchNews } from "../../entities/news/newsApi";
import NewsPageView from "./NewsPageView";

function NewsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    fetchNews()
      .then((response) => {
        setItems(response?.items ?? []);
      })
      .catch((err) => {
        setError(err?.message || "Не удалось загрузить новости");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return <NewsPageView items={items} loading={loading} error={error} />;
}

export default NewsPage;
