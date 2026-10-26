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
    <div className="flex justify-center mt-4 gap-2 items-center">
      <button
        onClick={() => handlePageChange(pageNo - 1)}
        disabled={pageNo === 1}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Prev
      </button>

      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => handlePageChange(i + 1)}
          className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
            pageNo === i + 1
              ? "text-white border-transparent shadow-sm"
              : "border-gray-200 hover:bg-gray-50 text-gray-700"
          }`}
          style={pageNo === i + 1 ? { backgroundColor: "#23ada4" } : {}}
        >
          {i + 1}
        </button>
      ))}

      <button
        onClick={() => handlePageChange(pageNo + 1)}
        disabled={pageNo === totalPages}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
