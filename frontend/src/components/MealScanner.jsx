// frontend/src/components/MealScanner.jsx
import { useState } from "react";
import "./MealScanner.css";

export default function MealScanner() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const resp = await fetch("http://localhost:5000/api/meals/scan", {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Upload failed");
      }
      const data = await resp.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meal-scanner">
      <h2 className="scanner-title">AI Food Image Scanner</h2>
      <form className="scanner-form" onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
        />
        <button type="submit" disabled={loading} className="scan-btn">
          {loading ? "Analyzing…" : "Scan Image"}
        </button>
      </form>

      {loading && (
        <div className="scanner-loading">
          <div className="spinner" />
          <p>AI is analyzing your plate…</p>
        </div>
      )}

      {error && <p className="error-msg">Error: {error}</p>}

      {result && (
        <div className="result-card">
          <h3>{result.food_name || result.foodName}</h3>
          <ul>
            <li>Calories: {result.calories}</li>
            <li>Carbs: {result.carbs}g</li>
            <li>Protein: {result.protein}g</li>
            <li>Fats: {result.fats}g</li>
          </ul>
        </div>
      )}
    </div>
  );
}
