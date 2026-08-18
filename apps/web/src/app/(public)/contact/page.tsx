'use client';

import React, { useState } from 'react';
import { Container, Typography, Box, Grid, Paper, TextField, Button, Card, CardContent, Stack, CircularProgress } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SendIcon from '@mui/icons-material/Send';
import toast from 'react-hot-toast';

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                <Box sx={{ bgcolor: 'rgba(27, 79, 216, 0.1)', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon color="primary" sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Direct Call / WhatsApp</Typography>
                  <Typography variant="h6" fontWeight="bold">+91 98765 43210</Typography>
                  <Typography variant="caption" color="text.secondary">Monday to Saturday: 9:00 AM - 7:00 PM</Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                <Box sx={{ bgcolor: 'rgba(27, 79, 216, 0.1)', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                  <EmailIcon color="primary" sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Email Support</Typography>
                  <Typography variant="h6" fontWeight="bold">support@rewabhoomi.com</Typography>
                  <Typography variant="caption" color="text.secondary">Hum 24 hours ke andar reply karne ki koshish karte hain.</Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                <Box sx={{ bgcolor: 'rgba(27, 79, 216, 0.1)', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon color="primary" sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Office Address</Typography>
                  <Typography variant="h6" fontWeight="bold">Rewa (Madhya Pradesh), India</Typography>
                  <Typography variant="caption" color="text.secondary">Sirmour Chauraha, Rewa, 486001</Typography>
                </Box>
              </CardContent>
            </Card>
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
