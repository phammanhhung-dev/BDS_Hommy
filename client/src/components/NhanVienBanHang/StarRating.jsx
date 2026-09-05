/**
 * StarRating Component
 * 5-star rating with keyboard accessibility
 * @component
 */

import React, { useState, useEffect } from 'react';
import { HiStar } from 'react-icons/hi2';
import './StarRating.css';

/**
 * @param {Object} props
 * @param {number} props.value - Current rating value (1-5)
 * @param {Function} props.onChange - Callback when rating changes
 * @param {boolean} props.readonly - Read-only mode
 * @param {number} props.size - Star size ('sm', 'md', 'lg')
 * @param {string} props.label - Accessible label
 */
const StarRating = ({ 
  value = 0, 
  onChange, 
  readonly = false, 
  size = 'md',
  label = 'Đánh giá'
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(value);

  useEffect(() => {
    setCurrentRating(value);
  }, [value]);

  const handleClick = (rating) => {
    if (readonly) return;
    setCurrentRating(rating);
    if (onChange) {
      onChange(rating);
    }
  };

  const handleKeyDown = (e, rating) => {
    if (readonly) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(rating);
    } else if (e.key === 'ArrowRight' && rating < 5) {
      e.preventDefault();
      handleClick(rating + 1);
    } else if (e.key === 'ArrowLeft' && rating > 1) {
      e.preventDefault();
      handleClick(rating - 1);
    }
  };

  const displayRating = hoverRating || currentRating;

  return (
    <div 
      className={`nvbh-star-rating nvbh-star-rating--${size} ${readonly ? 'nvbh-star-rating--readonly' : ''}`}
      role="radiogroup"
      aria-label={label}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`nvbh-star-rating__star ${star <= displayRating ? 'nvbh-star-rating__star--active' : ''}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          onKeyDown={(e) => handleKeyDown(e, star)}
          disabled={readonly}
          role="radio"
          aria-checked={star === currentRating}
          aria-label={`${star} sao`}
          tabIndex={readonly ? -1 : (star === currentRating || (currentRating === 0 && star === 1) ? 0 : -1)}
        >
          <HiStar className="nvbh-star-rating__icon" />
        </button>
      ))}
      <span className="nvbh-star-rating__value" aria-live="polite">
        {currentRating > 0 ? `${currentRating}/5` : 'Chưa đánh giá'}
      </span>
    </div>
  );
};

export default StarRating;







