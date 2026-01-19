import React, { useState } from 'react';

const conditions = {
  brand_new: 'Brand New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  works: 'Works'
};

export default function ProductModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
    fixedPrice: '',
    showOriginalPrice: false,
    originalPrice: '',
    condition: '',
    deliveryType: 'free_shipping',
    shippingCharge: '',
    localPickup: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title) errs.title = 'Title is required';
    if (!form.fixedPrice || isNaN(form.fixedPrice)) errs.fixedPrice = 'Valid fixed price required';
    if (form.showOriginalPrice && (!form.originalPrice || isNaN(form.originalPrice))) {
      errs.originalPrice = 'Original price is required';
    }
    if (!form.condition) errs.condition = 'Condition is required';
    if (form.deliveryType === 'charge_shipping' && (!form.shippingCharge || isNaN(form.shippingCharge))) {
      errs.shippingCharge = 'Shipping charge required';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
    } else {
      const data = {
        ...form,
        saleType: 'fixed',
        fixedPrice: parseFloat(form.fixedPrice),
        originalPrice: form.showOriginalPrice ? parseFloat(form.originalPrice) : null,
        shippingCharge: form.deliveryType === 'charge_shipping' ? parseFloat(form.shippingCharge) : 0,
      };
      onSubmit(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 w-full max-w-sm overflow-y-auto h-[90%] relative">
        <button
          className="absolute right-3 top-2 text-gray-600 text-xl"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-4 text-center">Listing item</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">

          {/* Title */}
          <div>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Title"
              className="w-full border px-3 py-2 rounded"
            />
            {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              className="w-full border px-3 py-2 rounded resize-none"
              rows={3}
              maxLength={1200}
            />
          </div>

          {/* Tags */}
          <div>
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="Add tags (comma separated)"
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block mb-1">Condition</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(conditions).map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={`px-2 py-1 rounded border text-center ${
                    form.condition === key ? 'bg-blue-500 text-white' : 'bg-gray-100'
                  }`}
                  onClick={() => setForm(prev => ({ ...prev, condition: key }))}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.condition && <p className="text-red-500 text-xs">{errors.condition}</p>}
          </div>

          {/* Fixed Price */}
          <div>
            <label className="block mb-1">Fixed Price</label>
            <input
              name="fixedPrice"
              type="number"
              value={form.fixedPrice}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            {errors.fixedPrice && <p className="text-red-500 text-xs">{errors.fixedPrice}</p>}
          </div>

          {/* Original Price Toggle */}
          <div className="flex items-center justify-between">
            <label>Original Price</label>
            <input
              type="checkbox"
              name="showOriginalPrice"
              checked={form.showOriginalPrice}
              onChange={handleChange}
            />
          </div>
          {form.showOriginalPrice && (
            <div>
              <input
                name="originalPrice"
                type="number"
                value={form.originalPrice}
                onChange={handleChange}
                placeholder="Original Price"
                className="w-full border px-3 py-2 rounded"
              />
              {errors.originalPrice && <p className="text-red-500 text-xs">{errors.originalPrice}</p>}
            </div>
          )}

          {/* Delivery Type */}
          <div className="space-y-2">
            <label className="block font-medium">Shipping</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryType"
                  value="free_shipping"
                  checked={form.deliveryType === 'free_shipping'}
                  onChange={handleChange}
                />
                Free Shipping
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryType"
                  value="charge_shipping"
                  checked={form.deliveryType === 'charge_shipping'}
                  onChange={handleChange}
                />
                Charge Shipping
              </label>
              {form.deliveryType === 'charge_shipping' && (
                <input
                  type="number"
                  name="shippingCharge"
                  value={form.shippingCharge}
                  onChange={handleChange}
                  placeholder="Shipping Charge"
                  className="w-full border px-3 py-2 rounded"
                />
              )}
              {errors.shippingCharge && <p className="text-red-500 text-xs">{errors.shippingCharge}</p>}
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  name="localPickup"
                  checked={form.localPickup}
                  onChange={handleChange}
                />
                Offer Local Pickup
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded mt-4"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
