'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Container, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { apiGet } from '@/lib/api';
import type { Poster } from '@rewa-bhoomi/types';

export default function PosterBannerSection() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function loadPosters() {
      try {
        const data = await apiGet<Poster[]>('/posters');
        if (mounted && Array.isArray(data)) {
          setPosters(data.filter((p) => p.is_active));
        }
      } catch (err) {
        console.error('Failed to load active posters:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadPosters();
    return () => {
      mounted = false;
    };
  }, []);

  // Autoplay
  useEffect(() => {
    if (posters.length <= 1) return;

    const startTimer = () => {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % posters.length);
      }, 5000);
    };

    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [posters.length, currentIndex]);

  if (isLoading || posters.length === 0) {
    return null;
  }

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + posters.length) % posters.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % posters.length);
  };

  // High Sensitivity Touch Swipe Handlers for Mobile Hand Swapping
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
    if (touchStartX.current !== null) {
      const deltaX = Math.abs(touchEndX.current - touchStartX.current);
      const deltaY = Math.abs(touchEndY.current - (touchStartY.current || 0));
      if (deltaX > 15 && deltaX > deltaY) {
        isSwiping.current = true;
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = Math.abs((touchStartY.current || 0) - (touchEndY.current || 0));

    // Minimum swipe threshold of 30px with predominantly horizontal gesture
    if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        handleNext(); // Swiped left -> Next
      } else {
        handlePrev(); // Swiped right -> Previous
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
    setTimeout(() => {
      isSwiping.current = false;
    }, 100);
  };

  const currentPoster = posters[currentIndex];

  const handleBannerClick = () => {
    if (isSwiping.current) return; // Ignore link clicks if user was swiping by hand
    if (currentPoster?.redirect_url) {
      if (currentPoster.redirect_url.startsWith('http')) {
        window.open(currentPoster.redirect_url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = currentPoster.redirect_url;
      }
    }
  };

  return (
    <Box component="section" sx={{ py: { xs: 2, md: 3 }, bgcolor: '#F8FAFC' }}>
      <Container maxWidth="lg">
        <Box
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleBannerClick}
          sx={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            borderRadius: { xs: 2.5, md: 3.5 },
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
            cursor: currentPoster?.redirect_url ? 'pointer' : 'default',
            bgcolor: '#FFFFFF',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            lineHeight: 0,
            touchAction: 'pan-y',
            userSelect: 'none',
          }}
        >

          {/* Responsive Picture: Loads mobile_image_url on mobile and image_url on desktop */}
          <picture style={{ width: '100%', display: 'block' }}>
            {currentPoster.mobile_image_url && (
              <source media="(max-width: 640px)" srcSet={currentPoster.mobile_image_url} />
            )}
            <img
              src={currentPoster.image_url || currentPoster.mobile_image_url || ''}
              alt={currentPoster.title || 'Rewa Bhoomi Special Offer'}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                transition: 'opacity 0.4s ease-in-out',
              }}
            />
          </picture>



          {/* Navigation Arrows for Multi-posters (Visible on Mobile, Tablet & Desktop) */}
          {posters.length > 1 && (
            <>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev(e);
                }}
                aria-label="Previous Poster"
                sx={{
                  position: 'absolute',
                  left: { xs: 8, sm: 12, md: 20 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.92)',
                  color: '#0F172A',
                  zIndex: 10,
                  width: { xs: 32, sm: 38, md: 44 },
                  height: { xs: 32, sm: 38, md: 44 },
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: '#FFFFFF',
                    transform: 'translateY(-50%) scale(1.08)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.28)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 }, color: '#0F172A' }} />
              </IconButton>

              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext(e);
                }}
                aria-label="Next Poster"
                sx={{
                  position: 'absolute',
                  right: { xs: 8, sm: 12, md: 20 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.92)',
                  color: '#0F172A',
                  zIndex: 10,
                  width: { xs: 32, sm: 38, md: 44 },
                  height: { xs: 32, sm: 38, md: 44 },
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: '#FFFFFF',
                    transform: 'translateY(-50%) scale(1.08)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.28)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ChevronRightIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 }, color: '#0F172A' }} />
              </IconButton>


              {/* Indicator Dots */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: { xs: 6, md: 12 },
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 0.8,
                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(6px)',
                  px: 1.2,
                  py: 0.5,
                  borderRadius: 10,
                  zIndex: 2,
                }}
              >
                {posters.map((_, idx) => (
                  <Box
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    sx={{
                      width: idx === currentIndex ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: idx === currentIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Box>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}
