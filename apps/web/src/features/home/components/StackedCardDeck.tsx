'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';

const CARDS = [
  { id: 1, title: 'Direct Owner Deal', desc: 'Koi broker fees nahi! Direct owner se call par baat karein aur brokerage ka faltoo paisa bachayein.', badge: '0% Brokerage', color: '#1E40AF' },
  { id: 2, title: '100% Verified Properties', desc: 'Hum sabhi listing ko double verify karte hain. Fake listings ya double sales ka darr ab khatam.', badge: 'Verified Listings', color: '#065F46' },
  { id: 3, title: 'Interactive Bhu-Maps', desc: 'Apne plot aur colony coordinates maps ke saath dekhein. Sahi boundaries ka live verification online.', badge: 'Map Support', color: '#B45309' },
  { id: 4, title: 'In-app Safe Chat & Groups', desc: 'Owners aur buyers ke sath securely negotiate karne ke liye dynamic groups aur chat option.', badge: 'Direct Chats', color: '#4F46E5' },
  { id: 5, title: 'Direct Audio/Video Calls', desc: 'Secure custom calling bina mobile number share kiye, taaki privacy leak hone ka koi khatra na rahe.', badge: 'Privacy Calls', color: '#BE123C' },
  { id: 6, title: 'SEO-Friendly Blog Guide', desc: 'Rewa me plot lene ka sahi tarika aur registry tips padhein hamare experts se details me.', badge: 'Expert Advice', color: '#0369A1' },
];

export default function StackedCardDeck() {
  const [deck, setDeck] = useState(CARDS);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipedCardId, setSwipedCardId] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const startDragPos = useRef({ x: 0, y: 0 });

  // Auto rotate deck every 4.5 seconds
  useEffect(() => {
    if (isDragging || swipedCardId !== null || isHovered) return;
    const interval = setInterval(() => {
      triggerSwipe('right');
    }, 4500);
    return () => clearInterval(interval);
  }, [isDragging, swipedCardId, deck, isHovered]);

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (swipedCardId !== null) return; // Prevent double trigger

    setSwipedCardId(deck[0].id);
    setSwipeDirection(direction);

    // Wait for the fly-out animation (350ms) to complete before reordering the deck
    setTimeout(() => {
      setDeck((prev) => {
        const copy = [...prev];
        if (direction === 'right') {
          const first = copy.shift();
          if (first) copy.push(first);
        } else {
          const last = copy.pop();
          if (last) copy.unshift(last);
        }
        return copy;
      });
      // Reset swipe state
      setSwipedCardId(null);
      setSwipeDirection(null);
      setDragOffset({ x: 0, y: 0 });
    }, 350);
  };

  // Drag Actions
  const handleStart = (clientX: number, clientY: number) => {
    if (swipedCardId !== null) return; // Prevent drag during exit animation
    setIsDragging(true);
    startDragPos.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - startDragPos.current.x;
    const dy = clientY - startDragPos.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;
    if (dragOffset.x > threshold) {
      triggerSwipe('right');
    } else if (dragOffset.x < -threshold) {
      triggerSwipe('left');
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Events binding
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };
  const onTouchEnd = () => handleEnd();

  return (
    <Box
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      sx={{
        position: 'relative',
        width: { xs: 290, sm: 320 },
        height: 380,
        mx: 'auto',
        cursor: isDragging ? 'grabbing' : swipedCardId !== null ? 'default' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {deck.map((card, idx) => {
        // Limit rendering stack size to top 4 cards
        if (idx > 3) return null;

        const isTop = idx === 0;
        const isSwiping = card.id === swipedCardId;

        // Custom stack transforms
        let transform = '';
        let opacity = 1 - idx * 0.16;
        const zIndex = 100 - idx;

        if (isSwiping) {
          // Exit fly-out animation
          const targetX = swipeDirection === 'right' ? 500 : -500;
          transform = `translate3d(${targetX}px, ${dragOffset.y}px, 0) rotate(${targetX * 0.06}deg)`;
          opacity = 0;
        } else if (isTop) {
          // Top card normal drag offset
          transform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.06}deg)`;
        } else {
          // Bottom cards positions (slightly scaled, rotated and offset)
          const scale = 1 - idx * 0.055;
          const translateY = idx * 14;
          const translateX = idx * 10;
          const rotate = idx * 3;
          transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`;
        }

        return (
          <Card
            key={card.id}
            onMouseDown={isTop ? onMouseDown : undefined}
            onTouchStart={isTop ? onTouchStart : undefined}
            onMouseEnter={isTop ? () => setIsHovered(true) : undefined}
            onMouseLeave={isTop ? () => setIsHovered(false) : undefined}
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: 4,
              boxShadow: isTop ? 12 : 4,
              background: `linear-gradient(135deg, ${card.color}, ${card.color}DD)`,
              color: 'white',
              transform: (isTop && isHovered && !isDragging) 
                ? `translate3d(${dragOffset.x}px, ${dragOffset.y - 10}px, 0) scale(1.02) rotate(${dragOffset.x * 0.06}deg)`
                : transform,
              opacity,
              zIndex,
              transition: isDragging && isTop && !isSwiping
                ? 'none'
                : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15), opacity 0.35s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
              '&:hover': isTop && !isDragging ? {
                boxShadow: 20,
              } : {},
            }}
          >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3, '&:last-child': { pb: 3 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip
                  label={card.badge}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    color: 'white',
                    fontWeight: 700,
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: '0.72rem',
                  }}
                />
                <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 500 }}>
                  Rewa Bhoomi
                </Typography>
              </Box>

              <Box my="auto">
                <Typography variant="h5" component="h3" fontWeight={800} gutterBottom sx={{ fontSize: '1.45rem', lineHeight: 1.25 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.88, lineHeight: 1.6, fontSize: '0.88rem' }}>
                  {card.desc}
                </Typography>
              </Box>

              <Box mt="auto" borderTop="1px solid rgba(255,255,255,0.15)" pt={2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ opacity: 0.7, fontStyle: 'italic', fontSize: '0.72rem' }}>
                  Swipe left/right to browse
                </Typography>
                <Typography variant="caption" fontWeight="bold">
                  {card.id} / {CARDS.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
