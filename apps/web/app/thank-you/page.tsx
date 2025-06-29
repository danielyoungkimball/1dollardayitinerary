"use client";

import { useEffect, useState } from 'react';

export default function ThankYouPage() {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get email from localStorage (set during form submission)
    const formData = localStorage.getItem('itineraryForm');
    if (formData) {
      const parsed = JSON.parse(formData);
      setEmail(parsed.email);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center px-2 sm:px-0 min-h-screen">
        <div className="w-full max-w-md sm:max-w-lg bg-zinc-900 shadow-2xl rounded-2xl p-6 sm:p-10 border border-zinc-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-zinc-400">Processing your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center px-2 sm:px-0 min-h-screen">
      <div className="w-full max-w-md sm:max-w-lg bg-zinc-900 shadow-2xl rounded-2xl p-6 sm:p-10 border border-zinc-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center tracking-tight">
            Payment Successful!
          </h1>
          
          <p className="text-zinc-400 text-center mb-6 text-base sm:text-lg">
            Thank you for your purchase! Your personalized day itinerary is being generated and will be sent to:
          </p>
          
          <div className="bg-zinc-800 rounded-lg p-4 mb-6">
            <p className="text-blue-400 font-medium">{email}</p>
          </div>
          
          <div className="space-y-4 text-sm text-zinc-400">
            <p>✨ Your itinerary will include:</p>
            <ul className="text-left space-y-2">
              <li>• Time-scheduled activities for your day</li>
              <li>• Restaurant and attraction recommendations</li>
              <li>• Estimated costs and travel tips</li>
              <li>• Beautiful PDF format for easy reference</li>
            </ul>
          </div>
          
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-zinc-500 text-sm">
              Check your email in the next few minutes. If you don't see it, check your spam folder.
            </p>
          </div>
          
          <a
            href="/"
            className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition text-base"
          >
            Create Another Itinerary
          </a>
        </div>
      </div>
    </div>
  );
} 