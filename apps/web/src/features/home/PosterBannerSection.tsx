'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Container, IconButton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import type { Poster } from '@rewa-bhoomi/types';
import { PosterBannerSkeleton } from './HomeSkeletons';
import { usePosters } from './api/useHomeData';

function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export default function PosterBannerSection() {
  const { data: posters = [], isLoading } = usePosters();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  // Autoplay (pauses if user is currently watching a video)
  useEffect(() => {
    if (posters.length <= 1 || isPlayingVideo) return;

    const startTimer = () => {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % posters.length);
        setIsPlayingVideo(false);
      }, 5000);
    };

    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [posters.length, currentIndex, isPlayingVideo]);

  // If loading, show the full-width banner skeleton to avoid any layout shift (CLS)
  if (isLoading) {
    return <PosterBannerSkeleton />;
  }

  if (posters.length === 0) {
    return null;
  }

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlayingVideo(false);
    setCurrentIndex((prev) => (prev - 1 + posters.length) % posters.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlayingVideo(false);
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
  const ytVideoId = extractYouTubeVideoId(currentPoster?.video_url);

  const handleBannerClick = () => {
    if (isSwiping.current) return; // Ignore link clicks if user was swiping by hand
    if (ytVideoId && !isPlayingVideo) {
      setIsPlayingVideo(true);
      return;
    }
    if (currentPoster?.redirect_url) {
      if (currentPoster.redirect_url.startsWith('http')) {
        window.open(currentPoster.redirect_url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = currentPoster.redirect_url;
      }
    }
  };

  return (
    <Box component="section" sx={{ pt: { xs: 1.5, sm: 2, md: 2.5 }, pb: { xs: 1, sm: 1.5, md: 2 }, bgcolor: '#F8FAFC' }}>
      <Container maxWidth="lg">
        <Box
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleBannerClick}
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: { xs: '2/1', sm: '21/9', md: '24/7' },
            overflow: 'hidden',
            borderRadius: { xs: 2.5, md: 3.5 },
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
            cursor: ytVideoId || currentPoster?.redirect_url ? 'pointer' : 'default',
            bgcolor: '#0F172A',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            touchAction: 'pan-y',
            userSelect: 'none',
          }}
        >

          {/* Responsive Picture / Thumbnail */}
          <picture style={{ width: '100%', height: '100%', display: 'block' }}>
            {currentPoster.mobile_image_url && (
              <source media="(max-width: 640px)" srcSet={currentPoster.mobile_image_url} />
            )}
            <img
              src={
                currentPoster.image_url ||
                currentPoster.mobile_image_url ||
                (ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` : '')
              }
              alt={currentPoster.title || 'Rewa Bhoomi Special Offer'}
              // @ts-expect-error - fetchpriority is standard in modern browsers
              fetchpriority="high"
              loading="eager"
              decoding="async"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'opacity 0.4s ease-in-out',
              }}
            />
          </picture>

          {/* YouTube Video Badge & Play Button Overlay (when video is not yet playing) */}
          {ytVideoId && !isPlayingVideo && (
            <>
              <Box
                sx={{
                  position: 'absolute',
                  top: { xs: 10, sm: 16 },
                  left: { xs: 10, sm: 16 },
                  bgcolor: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(6px)',
                  color: '#FFFFFF',
                  px: { xs: 1, sm: 1.5 },
                  py: 0.4,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  zIndex: 2,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#EF4444',
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.4, transform: 'scale(0.8)' },
                      '100%': { opacity: 1, transform: 'scale(1)' },
                    },
                  }}
                />
                <Typography sx={{ fontSize: { xs: '0.68rem', sm: '0.78rem' }, fontWeight: 700 }}>
                  Featured Video
                </Typography>
              </Box>

              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlayingVideo(true);
                }}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: '#DC2626',
                  color: '#FFFFFF',
                  px: { xs: 2.2, sm: 3 },
                  py: { xs: 1, sm: 1.2 },
                  borderRadius: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  boxShadow: '0 8px 30px rgba(220, 38, 38, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 3,
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    transform: 'translate(-50%, -50%) scale(1.08)',
                    boxShadow: '0 12px 36px rgba(220, 38, 38, 0.7)',
                    bgcolor: '#B91C1C',
                  },
                }}
              >
                <PlayArrowIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.82rem', sm: '0.95rem' }, letterSpacing: 0.4 }}>
                  Click to Play Video
                </Typography>
              </Box>
            </>
          )}

          {/* Active YouTube Embed Player (Plays smoothly inline without changing card size) */}
          {ytVideoId && isPlayingVideo && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 10,
                bgcolor: '#000000',
              }}
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={currentPoster.title || 'Rewa Bhoomi Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  width: '100%',
                  height: '100%',
                  border: 0,
                  display: 'block',
                }}
              />
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlayingVideo(false);
                }}
                aria-label="Close Video"
                sx={{
                  position: 'absolute',
                  top: { xs: 8, sm: 12 },
                  right: { xs: 8, sm: 12 },
                  zIndex: 20,
                  bgcolor: 'rgba(0, 0, 0, 0.75)',
                  color: '#FFFFFF',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.95)' },
                }}
              >
                <CloseIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              </IconButton>
            </Box>
          )}

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
                  width: { xs: 44, sm: 44, md: 48 },
                  height: { xs: 44, sm: 44, md: 48 },
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
                <ChevronLeftIcon sx={{ fontSize: { xs: 24, sm: 26, md: 28 }, color: '#0F172A' }} />
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
                  width: { xs: 44, sm: 44, md: 48 },
                  height: { xs: 44, sm: 44, md: 48 },
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
                <ChevronRightIcon sx={{ fontSize: { xs: 24, sm: 26, md: 28 }, color: '#0F172A' }} />
              </IconButton>


              {/* Indicator Dots */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: { xs: 6, md: 12 },
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(6px)',
                  px: 1,
                  py: 0.2,
                  borderRadius: 10,
                  zIndex: 2,
                }}
              >
                {posters.map((_, idx) => (
                  <Box
                    component="button"
                    key={idx}
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setIsPlayingVideo(false);
                      setCurrentIndex(idx);
                    }}
                    sx={{
                      background: 'none',
                      border: 'none',
                      p: '6px 4px',
                      minWidth: 28,
                      minHeight: 28,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:focus-visible': { outline: '2px solid #FFFFFF', borderRadius: 1 },
                    }}
                  >
                    <Box
                      sx={{
                        width: idx === currentIndex ? 18 : 6,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: idx === currentIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}
