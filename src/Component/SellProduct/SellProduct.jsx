import React, { useEffect, useState } from "react";
import ProductModal from "./ProductModal";
import { useDispatch, useSelector } from "react-redux";
import { mainCategory } from "../../features/slices/categorySlice";

export default function SellProduct() {
  const dispatch = useDispatch();
  const selector = useSelector((state) => state);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    dispatch(mainCategory({ pageNo: 1, size: 1000000000 }))
      .then((result) => {
        if (!mainCategory.fulfilled.match(result)) {
          const { message, code } = result.payload || {};
          console.error(`Fetch failed [${code}]: ${message}`);
        }
      })
      .catch((error) => {
        console.error("Unexpected error:", error);
      });
  }, [dispatch]);

  return (
    <div className="p-4">
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Product
      </button>
    </div>
  );
}
