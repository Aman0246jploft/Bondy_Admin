import React, { useState } from "react";
import Button from "../Atoms/Button/Button";
import { useTheme } from "../../contexts/theme/hook/useTheme";

export default function AddCategoryForm({ onClose }) {
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    name: "",
    image: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("name", formData.name);
    if (formData.image) {
      payload.append("image", formData.image);
    }
    console.log("Submitting category:", formData);
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 rounded"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
      }}
    >
      <h3
        className="text-lg font-bold"
        style={{ color: theme.colors.textPrimary }}
      >
        Add New Category
      </h3>

      <div>
        <label
          className="block mb-1 font-medium"
          style={{ color: theme.colors.textSecondary }}
        >
          Name
        </label>
        <input
          type="text"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 rounded"
          style={{
            backgroundColor: theme.colors.inputBackground,
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.textPrimary,
          }}
        />
      </div>

      <div>
        <label
          className="block mb-1 font-medium"
          style={{ color: theme.colors.textSecondary }}
        >
          Image
        </label>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          className="w-full p-2 rounded"
          style={{
            backgroundColor: theme.colors.inputBackground,
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.textPrimary,
          }}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          onClick={onClose}
          style={{
            backgroundColor: theme.colors.buttonSecondary,
            color: theme.colors.buttonText,
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          style={{
            backgroundColor: theme.colors.buttonPrimary,
            color: theme.colors.buttonText,
          }}
        >
          Submit
        </Button>
      </div>
    </form>
  );
}
