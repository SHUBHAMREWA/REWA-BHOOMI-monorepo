'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

function XIcon({ fontSize = 20, color = 'currentColor' }: { fontSize?: number; color?: string }) {
  return (
    <svg
      width={fontSize}
      height={fontSize}
      viewBox="0 0 24 24"
      fill={color}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface ShareAppModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'share' | 'qr';
  customUrl?: string;
  customTitle?: string;
}

export default function ShareAppModal({
  open,
  onClose,
  initialTab = 'share',
  customUrl,
  customTitle,
}: ShareAppModalProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'qr'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('https://rewabhoomi.com');
  const qrCanvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, open]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(customUrl || window.location.origin);
    }
  }, [customUrl, open]);

  const shareTitle = customTitle || 'Rewa Bhoomi — Buy, Sell & Rent Properties in Rewa, MP';
  const shareText = `🏡 Check out Rewa Bhoomi — Rewa's #1 Trusted Real Estate Platform for Buying, Selling & Renting Properties!`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success('Link copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: url,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    try {
      const canvas = qrCanvasRef.current?.querySelector('canvas');
      if (!canvas) {
        toast.error('QR code not ready');
        return;
      }
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'RewaBhoomi-QR.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success('QR Code image downloaded! 📥');
    } catch {
      toast.error('Failed to download QR code');
    }
  };

  // Social share URLs
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${shareText}\n${url}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      scroll="body"
      PaperProps={{
        sx: {
          borderRadius: { xs: 3, sm: 3.5 },
          bgcolor: '#FFFFFF',
          color: '#0F172A',
          p: { xs: 2, sm: 3 },
          m: { xs: 1.5, sm: 3 },
          maxWidth: { xs: 'calc(100vw - 24px)', sm: 420 },
          maxHeight: { xs: 'calc(100dvh - 32px)', sm: 'none' },
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflowY: 'auto',
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'visible' }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          aria-label="Close dialog"
          sx={{
            position: 'absolute',
            top: -4,
            right: -4,
            color: '#64748B',
            bgcolor: '#F1F5F9',
            '&:hover': { bgcolor: '#E2E8F0', color: '#0F172A' },
          }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* Modal Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 2, sm: 2.5 }, pr: 4 }}>
          <Box
            sx={{
              width: { xs: 38, sm: 44 },
              height: { xs: 38, sm: 44 },
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1B4FD8 0%, #1338A8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(27, 79, 216, 0.25)',
              flexShrink: 0,
            }}
          >
            {activeTab === 'share' ? (
              <ShareIcon sx={{ color: '#FFFFFF', fontSize: { xs: 20, sm: 22 } }} />
            ) : (
              <QrCode2Icon sx={{ color: '#FFFFFF', fontSize: { xs: 22, sm: 24 } }} />
            )}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#0F172A" sx={{ fontSize: { xs: '1.05rem', sm: '1.15rem' }, lineHeight: 1.2 }}>
              {activeTab === 'share' ? 'Share Rewa Bhoomi' : 'Scan QR Code'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: { xs: '0.75rem', sm: '0.8rem' }, mt: 0.2, display: 'block' }}>
              {activeTab === 'share'
                ? 'Help your friends find, buy & rent properties in Rewa'
                : 'Scan with camera to open Rewa Bhoomi'}
            </Typography>
          </Box>
        </Box>

        {/* Segmented Pill Switcher */}
        <Box
          sx={{
            display: 'flex',
            bgcolor: '#F1F5F9',
            borderRadius: 2.5,
            p: 0.4,
            mb: { xs: 2, sm: 2.5 },
            border: '1px solid #E2E8F0',
          }}
        >
          <Button
            fullWidth
            onClick={() => setActiveTab('share')}
            startIcon={<ShareIcon sx={{ fontSize: '17px !important' }} />}
            sx={{
              py: { xs: 0.7, sm: 0.9 },
              borderRadius: 2,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: activeTab === 'share' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'share' ? '#1B4FD8' : '#64748B',
              boxShadow: activeTab === 'share' ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: activeTab === 'share' ? '#FFFFFF' : 'rgba(0, 0, 0, 0.04)',
                color: activeTab === 'share' ? '#1B4FD8' : '#0F172A',
              },
            }}
          >
            Share Links
          </Button>
          <Button
            fullWidth
            onClick={() => setActiveTab('qr')}
            startIcon={<QrCode2Icon sx={{ fontSize: '17px !important' }} />}
            sx={{
              py: { xs: 0.7, sm: 0.9 },
              borderRadius: 2,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: activeTab === 'qr' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'qr' ? '#1B4FD8' : '#64748B',
              boxShadow: activeTab === 'qr' ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: activeTab === 'qr' ? '#FFFFFF' : 'rgba(0, 0, 0, 0.04)',
                color: activeTab === 'qr' ? '#1B4FD8' : '#0F172A',
              },
            }}
          >
            QR Code
          </Button>
        </Box>

        {/* TAB 1: Share Links */}
        {activeTab === 'share' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
            {/* Social Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1.2,
              }}
            >
              {/* WhatsApp */}
              <Box
                component="a"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.4,
                  borderRadius: 2.5,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(37, 211, 102, 0.08)',
                    borderColor: '#25D366',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    bgcolor: '#25D366',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 0.8,
                    boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)',
                  }}
                >
                  <WhatsAppIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.72rem' }}>
                  WhatsApp
                </Typography>
              </Box>

              {/* X / Twitter */}
              <Box
                component="a"
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.4,
                  borderRadius: 2.5,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(15, 23, 42, 0.06)',
                    borderColor: '#0F172A',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    bgcolor: '#0F172A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 0.8,
                    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.25)',
                  }}
                >
                  <XIcon fontSize={18} color="#FFFFFF" />
                </Box>
                <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.72rem' }}>
                  X
                </Typography>
              </Box>

              {/* Telegram */}
              <Box
                component="a"
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.4,
                  borderRadius: 2.5,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(34, 158, 217, 0.08)',
                    borderColor: '#229ED9',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    bgcolor: '#229ED9',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 0.8,
                    boxShadow: '0 4px 10px rgba(34, 158, 217, 0.3)',
                  }}
                >
                  <TelegramIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.72rem' }}>
                  Telegram
                </Typography>
              </Box>

              {/* LinkedIn */}
              <Box
                component="a"
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.4,
                  borderRadius: 2.5,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(10, 102, 194, 0.08)',
                    borderColor: '#0A66C2',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    bgcolor: '#0A66C2',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 0.8,
                    boxShadow: '0 4px 10px rgba(10, 102, 194, 0.3)',
                  }}
                >
                  <LinkedInIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.72rem' }}>
                  LinkedIn
                </Typography>
              </Box>
            </Box>

            {/* Native Share Sheet Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleNativeShare}
              startIcon={<FileUploadIcon sx={{ fontSize: 18 }} />}
              sx={{
                py: 1.1,
                borderRadius: 2.5,
                borderColor: '#CBD5E1',
                color: '#1B4FD8',
                bgcolor: '#FAFBFF',
                fontWeight: 700,
                fontSize: '0.86rem',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#1B4FD8',
                  bgcolor: 'rgba(27, 79, 216, 0.06)',
                },
              }}
            >
              More Apps (Share Sheet)
            </Button>

            {/* Copy Link Input Bar */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#64748B',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  mb: 0.7,
                  display: 'block',
                  fontSize: '0.7rem',
                }}
              >
                Or Copy Website Link
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: '#F8FAFC',
                  borderRadius: 2.5,
                  p: 0.6,
                  pl: 1.8,
                  border: '1px solid #E2E8F0',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    color: '#334155',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    mr: 1,
                  }}
                >
                  {url}
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleCopyLink}
                  startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                  sx={{
                    bgcolor: copied ? '#10B981' : '#1B4FD8',
                    background: copied
                      ? '#10B981'
                      : 'linear-gradient(135deg, #1B4FD8 0%, #1338A8 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    py: 0.7,
                    fontSize: '0.82rem',
                    boxShadow: copied ? '0 4px 10px rgba(16, 185, 129, 0.3)' : '0 4px 10px rgba(27, 79, 216, 0.3)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: copied ? '#059669' : '#1338A8',
                    },
                  }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* TAB 2: QR Code */}
        {activeTab === 'qr' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 1.8, sm: 2.2 } }}>
            {/* White QR Container */}
            <Box
              ref={qrCanvasRef}
              sx={{
                bgcolor: '#FFFFFF',
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '100%',
              }}
            >
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                <QRCodeCanvas
                  value={url}
                  size={165}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: '/favicon.png',
                    height: 30,
                    width: 30,
                    excavate: true,
                  }}
                />
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <QRCodeCanvas
                  value={url}
                  size={200}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: '/favicon.png',
                    height: 36,
                    width: 36,
                    excavate: true,
                  }}
                />
              </Box>
            </Box>

            {/* Scan Description */}
            <Box sx={{ textAlign: 'center', px: 1 }}>
              <Typography
                variant="body2"
                fontWeight={700}
                color="#0F172A"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.8,
                  mb: 0.4,
                  fontSize: { xs: '0.82rem', sm: '0.88rem' },
                }}
              >
                <CameraAltIcon sx={{ fontSize: 18, color: '#1B4FD8' }} />
                Scan with any mobile camera to open Rewa Bhoomi
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#1B4FD8',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  wordBreak: 'break-all',
                }}
              >
                {url}
              </Typography>
            </Box>

            {/* Download QR Code Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleDownloadQr}
              startIcon={<DownloadIcon />}
              sx={{
                py: { xs: 1, sm: 1.2 },
                borderRadius: 2.5,
                bgcolor: '#1B4FD8',
                background: 'linear-gradient(135deg, #1B4FD8 0%, #1338A8 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: { xs: '0.84rem', sm: '0.88rem' },
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(27, 79, 216, 0.3)',
                transition: 'all 0.2s',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #0F2D82 100%)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Download QR Code Image
            </Button>
          </Box>
        )}

        {/* Modal Footer: Close */}
        <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="text"
            onClick={onClose}
            sx={{
              color: '#64748B',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              px: 2.5,
              py: 0.6,
              fontSize: '0.85rem',
              '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' },
            }}
          >
            Close
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
