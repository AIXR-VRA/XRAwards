import React, { useState, useEffect } from 'react';

interface EventBannerProps {
  eventDate: string | null;
  ticketsUrl: string;
}

export const EventBanner: React.FC<EventBannerProps> = ({ eventDate, ticketsUrl }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    // Check if banner was dismissed
    const dismissed = localStorage.getItem('eventBannerDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Only show if event date exists and is in the future
    if (eventDate) {
      const event = new Date(eventDate);
      const now = new Date();
      
      if (event > now) {
        setIsVisible(true);
      }
    }
  }, [eventDate]);

  useEffect(() => {
    if (!isVisible || isDismissed || !eventDate) return;

    const updateCountdown = () => {
      const event = new Date(eventDate);
      const now = new Date();
      const diff = event.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isVisible, isDismissed, eventDate]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    localStorage.setItem('eventBannerDismissed', 'true');
  };

  if (!isVisible || isDismissed || !countdown) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#4923EB] via-[#3a1bb8] to-[#4923EB] text-white shadow-lg border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Countdown */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-xs sm:text-sm font-medium whitespace-nowrap">
              Event in:
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {countdown.days > 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-lg sm:text-xl font-bold font-['Jura']">
                    {countdown.days.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs opacity-80">Days</span>
                </div>
              )}
              <div className="flex flex-col items-center">
                <span className="text-lg sm:text-xl font-bold font-['Jura']">
                  {countdown.hours.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs opacity-80">Hours</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg sm:text-xl font-bold font-['Jura']">
                  {countdown.minutes.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs opacity-80">Mins</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg sm:text-xl font-bold font-['Jura']">
                  {countdown.seconds.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs opacity-80">Secs</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            <a
              href={ticketsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 sm:px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              Reserve Final Tickets Now
            </a>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

