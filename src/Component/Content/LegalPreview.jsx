import React from "react";
import "./legalPreview.css";

export default function LegalPreview({ title, html }) {
  return (
    <div className="lg-preview w-full max-w-full overflow-hidden">
      <p className="lg-preview-label">Preview</p>
      <h1 className="lg-h1 break-words">{title}</h1>
      <section className="lg-card w-full max-w-full overflow-hidden break-words">
        {html ? (
          <div className="lg-body w-full max-w-full [overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p style={{ margin: 0, color: "#8a8a8a" }}>No content yet.</p>
        )}
      </section>
    </div>
  );
}
