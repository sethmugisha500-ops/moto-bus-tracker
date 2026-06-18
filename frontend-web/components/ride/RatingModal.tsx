'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface RatingModalProps {
  rideId: string;
  driverName: string;
  onClose: () => void;
  onSubmit: () => void;
}

export const RatingModal = ({ rideId, driverName, onClose, onSubmit }: RatingModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.post(`/rides/${rideId}/rate`, {
        rating,
        comment,
      });
      onSubmit();
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Rate Your Ride</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-600">How was your ride with</p>
          <p className="font-semibold text-lg">{driverName}?</p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                className={`w-10 h-10 transition-all ${
                  (hoverRating || rating) >= star
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="text-center mb-6">
          <p className="text-sm font-medium text-gray-700">
            {ratingLabels[rating as keyof typeof ratingLabels] || 'Select rating'}
          </p>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share your experience (optional)
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your ride..."
            className="input-field resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full btn-primary disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </motion.div>
    </div>
  );
};