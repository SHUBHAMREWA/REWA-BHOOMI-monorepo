'use client';

import { Fab, Tooltip } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useCompanyCommunication } from '@/features/home/api/useHomeData';

export default function FloatingWhatsAppButton() {
  const { data: comm } = useCompanyCommunication();

  if (!comm?.whatsapp_number) return null;


  const whatsappHref = `https://wa.me/${comm.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(
    comm.whatsapp_message || 'Namaste, I want to inquire about properties on Rewa Bhoomi'
  )}`;

  return (
    <Tooltip title="Chat on WhatsApp" placement="left" arrow>
      <Fab
        component="a"
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        sx={{
          position: 'fixed',
          bottom: { xs: 126, md: 92 },
          right: { xs: 14, md: 28 },
          width: { xs: 40, md: 52 },
          height: { xs: 40, md: 52 },
          minHeight: 'unset',
          bgcolor: '#25D366',
          color: 'white',
          zIndex: 999,
          boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
          '&:hover': {
            bgcolor: '#1EBE5D',
            transform: 'scale(1.08)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <WhatsAppIcon sx={{ fontSize: { xs: 22, md: 28 } }} />
      </Fab>


    </Tooltip>
  );
}
