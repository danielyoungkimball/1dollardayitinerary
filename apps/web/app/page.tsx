"use client";

import { useState } from 'react';

const INTERESTS = [
  'Food',
  'Nature',
  'Art',
  'Chill',
  'Coffee',
  'Hiking',
];

export default function ItineraryFormPage() {
  const [form, setForm] = useState({
    city: '',
    date: '',
    start: '',
    end: '',
    interests: [] as string[],
    email: '',
  });
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allFilled =
    form.city &&
    form.date &&
    form.start &&
    form.end &&
    form.interests.length > 0 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({
        ...prev,
        interests: checked
          ? [...prev.interests, value]
          : prev.interests.filter((i) => i !== value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setTouched(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!allFilled) return;
    setLoading(true);
    try {
      // Store form data in localStorage
      localStorage.setItem('itineraryForm', JSON.stringify(form));
      // Call backend to create Stripe Checkout session
      const res = await fetch('http://localhost:3001/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || 'Checkout failed');
        setLoading(false);
        return;
      }
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center px-2 sm:px-0 min-h-screen">
      <div className="w-full max-w-md sm:max-w-lg bg-zinc-900 shadow-2xl rounded-2xl p-6 sm:p-10 border border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center tracking-tight">Build My $1 Day Plan</h1>
        <p className="text-zinc-400 text-center mb-6 text-base sm:text-lg">Get a custom, timestamped day itinerary for any city, delivered to your email.</p>
        <form
          className="space-y-5"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <div>
            <label className="block font-medium mb-1 text-zinc-200">City</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base"
              required
              placeholder="e.g. Paris"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-zinc-200">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base"
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block font-medium mb-1 text-zinc-200">Start time</label>
              <input
                type="time"
                name="start"
                value={form.start}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1 text-zinc-200">End time</label>
              <input
                type="time"
                name="end"
                value={form.end}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base"
                required
              />
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1 text-zinc-200">Interests</label>
            <div className="flex flex-wrap gap-3">
              {INTERESTS.map((interest) => (
                <label key={interest} className="flex items-center gap-1 text-zinc-300 text-base">
                  <input
                    type="checkbox"
                    name="interests"
                    value={interest}
                    checked={form.interests.includes(interest)}
                    onChange={handleChange}
                    className="accent-blue-500 w-5 h-5"
                  />
                  {interest}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1 text-zinc-200">Email address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-base"
              required
              placeholder="you@email.com"
            />
            {touched && form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) && (
              <p className="text-red-400 text-sm mt-1">Enter a valid email address.</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition text-lg shadow-md"
            disabled={!allFilled || loading}
          >
            {loading ? 'Redirecting…' : 'Build My $1 Day Plan'}
          </button>
          {error && <p className="text-red-400 text-center mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
} 