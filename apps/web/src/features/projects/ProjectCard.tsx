'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Link from 'next/link';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ShareIcon from '@mui/icons-material/Share';
import GridViewIcon from '@mui/icons-material/GridView';
import toast from 'react-hot-toast';

export interface ProjectCardData {
  id: string;
  slug: string;
  name: string;
  status: string;
  total_plots?: number;
  total_area?: number | string;
  developer?: string;
  city: string;
  state: string;
  address?: string | null;
  featured_image_url?: string | null;
  description?: string | null;
}

interface ProjectCardProps {
  project: ProjectCardData;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/projects/${project.slug}` : '';
    const title = project.name;
    const text = project.description || `Check out ${project.name} on Rewa Bhoomi`;

    if (navigator.share) {
      navigator.share({ title, text, url: shareUrl }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Project link copied to clipboard!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
      case 'UPCOMING':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'COMPLETED':
        return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
      default:
        return { bg: '#F1F5F9', text: '#334155', border: '#E2E8F0' };
    }
  };

  const statusStyle = getStatusColor(project.status);

  return (
    <Box
      component={Link}
      href={`/projects/${project.slug}`}
      id={`project-${project.id}`}
      data-project-slug={project.slug}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textDecoration: 'none',
        color: 'inherit',
        bgcolor: '#FFFFFF',
        borderRadius: { xs: '12px', sm: '16px' },
        border: '1.5px solid #80DEEA',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        boxShadow: '0 2px 8px rgba(0, 188, 212, 0.06)',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: '#00BCD4',
          boxShadow: '0 10px 24px rgba(0, 188, 212, 0.16)',
        },
      }}
    >
      {/* Media Top */}
      <Box sx={{ position: 'relative', height: { xs: 115, sm: 165, md: 195 }, bgcolor: '#0F172A' }}>
        {project.featured_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.featured_image_url}
            alt={project.name}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)' }}>
            <Box
              sx={{
                width: { xs: 36, sm: 50 },
                height: { xs: 36, sm: 50 },
                borderRadius: '50%',
                bgcolor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <Typography variant="h6" fontWeight={900} sx={{ color: '#1B4FD8', fontSize: { xs: '0.9rem', sm: '1.2rem' } }}>
                {project.name.substring(0, 2).toUpperCase()}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Top-Left Status Badge */}
        <Box sx={{ position: 'absolute', top: { xs: 5, sm: 8 }, left: { xs: 5, sm: 8 }, zIndex: 2 }}>
          <Box
            sx={{
              bgcolor: statusStyle.bg,
              color: statusStyle.text,
              border: `1px solid ${statusStyle.border}`,
              px: { xs: 0.6, sm: 0.9 },
              py: 0.25,
              borderRadius: '4px',
              fontSize: { xs: '0.58rem', sm: '0.7rem' },
              fontWeight: 800,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {project.status === 'ONGOING'
              ? 'ONGOING'
              : project.status === 'UPCOMING'
              ? 'UPCOMING'
              : project.status === 'COMPLETED'
              ? 'COMPLETED'
              : project.status}
          </Box>
        </Box>

        {/* Top-Right Action: Share Button */}
        <Box sx={{ position: 'absolute', top: { xs: 5, sm: 8 }, right: { xs: 5, sm: 8 }, zIndex: 2 }}>
          <IconButton
            onClick={handleShare}
            size="small"
            aria-label="Share project"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(4px)',
              width: { xs: 28, sm: 34 },
              height: { xs: 28, sm: 34 },
              color: '#334155',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              '&:hover': { bgcolor: '#FFFFFF', color: '#1B4FD8', transform: 'scale(1.08)' },
            }}
          >
            <ShareIcon sx={{ fontSize: { xs: 13, sm: 16 } }} />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <Box>
          {/* Title */}
          <Typography
            variant="h6"
            component="h3"
            fontWeight={700}
            sx={{
              fontSize: { xs: '0.8rem', sm: '0.95rem' },
              lineHeight: 1.25,
              mb: 0.3,
              color: '#0F172A',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.name}
          </Typography>

          {/* Location */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 0.4, sm: 0.8 }, gap: 0.5 }}>
            <Typography
              variant="body2"
              noWrap
              title={project.address || `${project.city}, ${project.state}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.3,
                fontSize: { xs: '0.66rem', sm: '0.78rem' },
                minWidth: 0,
                overflow: 'hidden',
                color: '#334155',
              }}
            >
              <LocationOnIcon sx={{ fontSize: { xs: 13, sm: 15 }, color: '#EF4444', flexShrink: 0 }} />
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.address || `${project.city}, ${project.state}`}
              </Box>
            </Typography>
          </Box>

          {/* Compact Specs: On Mobile sleek pill, On Desktop 2-column box */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.4, bgcolor: '#F1F5F9', borderRadius: '6px', px: 0.6, py: 0.25, mb: 0.6, overflow: 'hidden' }}>
            <GridViewIcon sx={{ fontSize: 12, color: '#334155', flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {project.total_plots || 0} Plots • {project.total_area ? `${project.total_area} sqft` : (project.developer || 'Mega Project')}
            </Typography>
          </Box>

          {/* Desktop Spec Box */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, bgcolor: '#F4F5F7', borderRadius: '8px', p: 1, mb: 1.5, justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontSize: '0.65rem', color: '#334155', fontWeight: 700 }}>Total Plots</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{project.total_plots || 0} Plots</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.65rem', color: '#334155', fontWeight: 700 }}>{project.developer ? 'Developer' : 'Total Area'}</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.developer || (project.total_area ? `${project.total_area} sqft` : 'Rewa Bhoomi')}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Bottom Row: Status / Availability + View -> Link */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: { xs: 0.5, sm: 1 }, borderTop: '1px solid #F1F5F9' }}>
          <Typography
            variant="h6"
            component="span"
            color="primary"
            fontWeight={800}
            sx={{ fontSize: { xs: '0.78rem', sm: '0.95rem' }, lineHeight: 1.1 }}
          >
            {project.status === 'ONGOING' ? 'Plots Available' : project.status === 'UPCOMING' ? 'Coming Soon' : 'Fully Sold'}
          </Typography>

          <Typography
            component="span"
            sx={{
              fontSize: { xs: '0.72rem', sm: '0.82rem' },
              fontWeight: 700,
              color: '#1B4FD8',
              display: 'flex',
              alignItems: 'center',
              gap: 0.2,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            View →
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
