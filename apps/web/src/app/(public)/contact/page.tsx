'use client';

import React, { useState, useEffect } from 'react';

import {
  Container, Typography, Box, Grid, Paper, TextField, Button,
  Card, CardContent, Stack, CircularProgress, Skeleton, IconButton, Chip, Link as MuiLink
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SendIcon from '@mui/icons-material/Send';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import toast from 'react-hot-toast';
import { apiGet } from '@/lib/api';
import type { CompanyCommunication } from '@rewa-bhoomi/types';

export default function ContactUsPage() {
  const [comm, setComm] = useState<CompanyCommunication | null>(null);
  const [isLoadingComm, setIsLoadingComm] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadComm() {
      try {
        const data = await apiGet<CompanyCommunication>('/communication');
        if (mounted && data) {
          setComm(data);
        }
      } catch (err) {
        // Silently fallback
      } finally {
        if (mounted) setIsLoadingComm(false);
      }
    }
    loadComm();
    return () => {
      mounted = false;
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.message) {
      toast.error('Kripya sabhi zaroori fields (Name, Contact, Message) ko bharein.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Aapka sandesh hume mil gaya hai! Hum jald hi aapse contact karenge.');
      setFormData({ name: '', contact: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Kuchh error ho gaya, kripya baad me try karein.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const phoneDisplay = comm?.contact_phone || comm?.whatsapp_number || '+91 78985 22932';
  const emailDisplay = comm?.contact_email || 'contact@rewabhoomi.com';
  const addressDisplay = comm?.office_address || 'Rewa, Madhya Pradesh, India';
  const whatsappHref = comm?.whatsapp_number
    ? `https://wa.me/${comm.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(
        comm.whatsapp_message || 'Namaste, I want to inquire about properties on Rewa Bhoomi'
      )}`
    : null;

  const hasSocials = Boolean(
    comm?.instagram_url || comm?.youtube_url || comm?.twitter_url || comm?.facebook_url || comm?.linkedin_url || whatsappHref
  );

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Contact Us
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Kya aapko property dhoodhne ya post karne me koi problem aa rahi hai? Humse contact karein!
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Contact Info Cards */}
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            
            {/* Phone & WhatsApp Card */}
            <Card sx={{ borderRadius: 3, boxShadow: 2, border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 3 }}>
                <Box sx={{ bgcolor: 'rgba(27, 79, 216, 0.1)', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon color="primary" sx={{ fontSize: 28 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Direct Call / Helpline</Typography>
                  {isLoadingComm ? (
                    <Skeleton variant="text" width={160} height={32} />
                  ) : (
                    <MuiLink
                      href={`tel:${phoneDisplay.replace(/\s+/g, '')}`}
                      underline="hover"
                      sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.15rem', display: 'block' }}
                    >
                      {phoneDisplay}
                    </MuiLink>
                  )}
                  <Typography variant="caption" color="text.secondary">Monday to Saturday: 9:00 AM - 7:00 PM</Typography>
                  
                  {whatsappHref && (
                    <Box mt={1}>
                      <Chip
                        component="a"
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        icon={<WhatsAppIcon sx={{ fontSize: '1rem !important', color: '#FFFFFF !important' }} />}
                        label="Chat on WhatsApp"
                        size="small"
                        clickable
                        sx={{ bgcolor: '#25D366', color: 'white', fontWeight: 700, fontSize: '0.75rem', '&:hover': { bgcolor: '#1EBE5D' } }}
                      />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Email Support Card */}
            <Card sx={{ borderRadius: 3, boxShadow: 2, border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 3 }}>
                <Box sx={{ bgcolor: 'rgba(27, 79, 216, 0.1)', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                  <EmailIcon color="primary" sx={{ fontSize: 28 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Email Support</Typography>
                  {isLoadingComm ? (
                    <Skeleton variant="text" width={200} height={32} />
                  ) : (
                    <MuiLink
                      href={`mailto:${emailDisplay}`}
                      underline="hover"
                      sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.05rem', display: 'block', wordBreak: 'break-all' }}
                    >
                      {emailDisplay}
                    </MuiLink>
                  )}
                  <Typography variant="caption" color="text.secondary">Hum 24 hours ke andar reply karne ki koshish karte hain.</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Office Address Card */}
            <Card sx={{ borderRadius: 3, boxShadow: 2, border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 3 }}>
                <Box sx={{ bgcolor: 'rgba(27, 79, 216, 0.1)', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon color="primary" sx={{ fontSize: 28 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Office Address</Typography>
                  {isLoadingComm ? (
                    <Skeleton variant="text" width="80%" height={32} />
                  ) : (
                    <Typography variant="h6" fontWeight="bold" fontSize="1.05rem">
                      {addressDisplay}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">Visit us during standard business hours</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Social Media Channels */}
            {hasSocials && (
              <Card sx={{ borderRadius: 3, boxShadow: 2, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#334155" mb={1.5}>
                    Follow & Connect With Us
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {whatsappHref && (
                      <IconButton
                        component="a"
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp"
                        sx={{ bgcolor: 'rgba(37, 211, 102, 0.15)', color: '#25D366', '&:hover': { bgcolor: '#25D366', color: 'white' } }}
                      >
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                    )}
                    {comm?.instagram_url && (
                      <IconButton
                        component="a"
                        href={comm.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        sx={{ bgcolor: 'rgba(228, 64, 95, 0.15)', color: '#E4405F', '&:hover': { bgcolor: '#E4405F', color: 'white' } }}
                      >
                        <InstagramIcon fontSize="small" />
                      </IconButton>
                    )}
                    {comm?.youtube_url && (
                      <IconButton
                        component="a"
                        href={comm.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                        sx={{ bgcolor: 'rgba(255, 0, 0, 0.15)', color: '#FF0000', '&:hover': { bgcolor: '#FF0000', color: 'white' } }}
                      >
                        <YouTubeIcon fontSize="small" />
                      </IconButton>
                    )}
                    {comm?.twitter_url && (
                      <IconButton
                        component="a"
                        href={comm.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter"
                        sx={{ bgcolor: 'rgba(29, 161, 242, 0.15)', color: '#1DA1F2', '&:hover': { bgcolor: '#1DA1F2', color: 'white' } }}
                      >
                        <TwitterIcon fontSize="small" />
                      </IconButton>
                    )}
                    {comm?.facebook_url && (
                      <IconButton
                        component="a"
                        href={comm.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        sx={{ bgcolor: 'rgba(24, 119, 242, 0.15)', color: '#1877F2', '&:hover': { bgcolor: '#1877F2', color: 'white' } }}
                      >
                        <FacebookIcon fontSize="small" />
                      </IconButton>
                    )}
                    {comm?.linkedin_url && (
                      <IconButton
                        component="a"
                        href={comm.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                        sx={{ bgcolor: 'rgba(10, 102, 194, 0.15)', color: '#0A66C2', '&:hover': { bgcolor: '#0A66C2', color: 'white' } }}
                      >
                        <LinkedInIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}

          </Stack>
        </Grid>


        {/* Contact Form */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              Hume Message Bhejein (Send us a message)
            </Typography>
            
            <form onSubmit={onSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Aapka Naam (Full Name)"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone Number / Email ID"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    helperText="Taki hum aapse contact kar sakein"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Subject (Kis baare me hai?)"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Aapka Sandesh (Message)"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    multiline
                    rows={5}
                    fullWidth
                    required
                  />
                </Grid>
              </Grid>

              <Box mt={4} display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={isSubmitting}
                  endIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                  sx={{ borderRadius: '8px', px: 4, py: 1.5 }}
                >
                  {isSubmitting ? 'Bhej rahe hain...' : 'Send Message'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
