import React from "react";

export default function Pagination({ pageNo, size, total, onChange }) {
  const totalPages = Math.ceil(total / size);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      onChange(newPage);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-4 gap-2">
      <button
        onClick={() => handlePageChange(pageNo - 1)}
        disabled={pageNo === 1}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </button>

      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => handlePageChange(i + 1)}
          className={`px-3 py-1 border rounded ${
            pageNo === i + 1 ? "bg-blue-500 text-white" : ""
          }`}
        >
          {i + 1}
        </button>
      ))}

      <button
        onClick={() => handlePageChange(pageNo + 1)}
        disabled={pageNo === totalPages}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
