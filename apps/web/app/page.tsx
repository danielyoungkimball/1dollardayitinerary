"use client";

import React, { useState, useRef } from 'react';

export default function ItineraryFormPage() {
  const [form, setForm] = useState({
    city: '',
    date: '',
    start: '',
    end: '',
    interests: [] as string[],
    email: '',
  });
  const [interestInput, setInterestInput] = useState('');
  const interestInputRef = useRef<HTMLInputElement>(null);
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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched(true);
  }

  function handleInterestInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInterestInput(e.target.value);
  }

  function handleInterestKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && interestInput.trim()) {
      e.preventDefault();
      const newInterest = interestInput.trim();
      if (!form.interests.includes(newInterest)) {
        setForm((prev) => ({ ...prev, interests: [...prev.interests, newInterest] }));
      }
      setInterestInput('');
    } else if (e.key === 'Backspace' && !interestInput && form.interests.length > 0) {
      setForm((prev) => ({ ...prev, interests: prev.interests.slice(0, -1) }));
    }
  }

  function removeInterest(interest: string) {
    setForm((prev) => ({ ...prev, interests: prev.interests.filter((i) => i !== interest) }));
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout`, {
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
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Build My $1 Day Plan</h1>
      <p>Get a custom, timestamped day itinerary for any city, delivered to your email.</p>
      <form onSubmit={handleSubmit} autoComplete="off">
        <div>
          <label>City</label>
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            required
            placeholder="e.g. Paris"
          />
        </div>
        <div>
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Start time</label>
          <input
            type="time"
            name="start"
            value={form.start}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>End time</label>
          <input
            type="time"
            name="end"
            value={form.end}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Interests</label>
          <div>
            {form.interests.map((interest) => (
              <span key={interest}>
                {interest}
                <button type="button" onClick={() => removeInterest(interest)} aria-label={`Remove ${interest}`}>×</button>
              </span>
            ))}
          </div>
          <input
            ref={interestInputRef}
            type="text"
            value={interestInput}
            onChange={handleInterestInputChange}
            onKeyDown={handleInterestKeyDown}
            placeholder="Type an interest and press Enter (e.g. Museums, Food, Parks)"
          />
        </div>
        <div>
          <label>Email address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@email.com"
          />
          {touched && form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) && (
            <p>Enter a valid email address.</p>
          )}
        </div>
        <button type="submit" disabled={!allFilled || loading}>
          {loading ? 'Redirecting…' : 'Build My $1 Day Plan'}
        </button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
} 