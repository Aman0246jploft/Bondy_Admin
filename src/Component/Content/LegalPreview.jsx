import React from "react";
import "./legalPreview.css";

export default function LegalPreview({ title, html }) {
  return (
    <div className="lg-preview">
      <p className="lg-preview-label">Preview</p>
      <h1 className="lg-h1">{title}</h1>
      <section className="lg-card">
        {html ? (
          <div className="lg-body" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p style={{ margin: 0, color: "#8a8a8a" }}>No content yet.</p>
        )}
      </section>
    </div>
  );
}
