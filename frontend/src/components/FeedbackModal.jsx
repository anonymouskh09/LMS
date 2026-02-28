import React, { useState } from 'react';
import { Star, X, ChatTeardropText, Sparkle } from '@phosphor-icons/react';

const FeedbackModal = ({ isOpen, onClose, onSubmit, title = "Rate your experience" }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    await onSubmit({ rating, comment });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Premium Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Glassmorphic Container */}
      <div className="relative bg-[#1e293b]/90 border border-white/10 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Animated Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl">
                <Sparkle size={28} weight="fill" className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
                <p className="text-gray-400 text-sm mt-1">Your feedback helps us improve training standards.</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all duration-300"
            >
              <X size={24} weight="bold" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col items-center py-6 bg-white/5 rounded-[24px] border border-white/5">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Select Rating</span>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="group relative transition-all duration-300 hover:scale-110 active:scale-95"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <div className="absolute inset-0 bg-yellow-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Star
                      size={48}
                      weight={(hover || rating) >= star ? "fill" : "regular"}
                      className={`relative transition-all duration-300 ${
                        (hover || rating) >= star
                          ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                          : 'text-white/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm font-medium text-gray-400">
                {rating === 5 ? "Loved it! 😍" : 
                 rating === 4 ? "Great experience! 👍" : 
                 rating === 3 ? "Good, but could be better. 🙂" : 
                 rating === 2 ? "Not what I expected. 😕" : 
                 rating === 1 ? "Very disappointed. 😞" : "How was it?"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/80 ml-1">
                <ChatTeardropText size={18} />
                <label className="text-sm font-semibold">Share your thoughts</label>
              </div>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300 min-h-[120px] resize-none"
                placeholder="What did you learn? Any suggestions for improvement?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-2xl text-white font-bold bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300"
              >
                Maybe Later
              </button>
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className={`flex-[2] py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/40 transition-all duration-300 flex items-center justify-center gap-2 ${
                  (submitting || rating === 0) ? 'opacity-50 grayscale cursor-not-allowed shadow-none' : 'hover:-translate-y-1 active:translate-y-0'
                }`}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Feedback</span>
                    <Sparkle size={18} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
