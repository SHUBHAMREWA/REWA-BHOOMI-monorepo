'use client';

import React from 'react';
import { Container, Typography, Box, Paper, Stack, Avatar } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

export default function PrivacyPolicyPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      {/* Header section */}
      <Box textAlign="center" mb={6}>
        <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
          <SecurityIcon sx={{ fontSize: 36 }} />
        </Avatar>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight="normal">
          Aapki personal information aur data ki suraksha hamari sabse badi priority hai.
        </Typography>
      </Box>

      {/* Main Content */}
      <Stack spacing={4}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom color="success.main">
            1. Hum Kounsa Data Collect Karte Hain? (Data We Collect)
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569', mb: 2 }}>
            Jab aap <strong>Rewa Bhoomi</strong> platform par aate hain, tab hum niche likha hua data collect karte hain:
          </Typography>
          <Typography variant="body1" component="div" sx={{ lineHeight: 1.8, color: '#475569' }}>
            <ul>
              <li><strong>Account Information:</strong> Register karte waqt aapka Name, Email Address, aur Phone Number.</li>
              <li><strong>Property Details:</strong> Jab aap property post karte hain, toh location details, photos, video urls aur property dimensions.</li>
              <li><strong>Chat & Connection Data:</strong> Portal par jab aap buyers ya sellers se chat karte hain, to messages aur attachment images safe database me store hoti hain.</li>
              <li><strong>Log Data:</strong> Aapke computer/mobile ka IP address, browser type aur pages visited details.</li>
            </ul>
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom color="success.main">
            2. Aapke Data Ka Use Kaise Hota Hai? (How We Use Your Data)
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569', mb: 2 }}>
            Collect kiya gaya data sirf isiliye use kiya jata hai taaki aapko behtar service di ja sake:
          </Typography>
          <Typography variant="body1" component="div" sx={{ lineHeight: 1.8, color: '#475569' }}>
            <ul>
              <li>Aapki properties ko display karne aur interested buyers/sellers se match karne ke liye.</li>
              <li>Aapko SMS ya Email notifications bhejne ke liye (jaise OTP validation ya property approval alerts).</li>
              <li>Platform par fraud, illegal activities aur brokers ke spam listings ko check karne aur ban karne ke liye.</li>
              <li>Hamare maps aur search capabilities ko modify aur smooth karne ke liye.</li>
            </ul>
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom color="success.main">
            3. Data Share Karne Ke Rules (Data Sharing)
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569' }}>
            Hum aapka personal data kisi bhi teesri party (marketing companies, ads agency) ko bechte ya rent par nahi dete hain. Aapka data sirf tabhi share hota hai jab:
          </Typography>
          <Typography variant="body1" component="div" sx={{ lineHeight: 1.8, color: '#475569', mt: 2 }}>
            <ul>
              <li>Aap kisi property page par 'Contact Owner' click karte hain, to owner ko aapka number dikhane ke liye taki contact ho sake.</li>
              <li>Government regulatory authorities ya legal actions ke orders par jaruri ho.</li>
            </ul>
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F0FDF4' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom color="success.main">
            4. Suraksha (Security Commitment)
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569' }}>
            Hamare custom servers secure authentication middleware aur encryption protocols (JWT, password hashes) use karte hain. Lekin dhyan rakhein, internet par koi bhi transmission 100% safe nahi hota, isliye password safe rakhein aur kisi se share na karein.
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom color="success.main">
            5. Cookies Policy
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569' }}>
            Hum cookies use karte hain aapko log-in status banaye rakhne ke liye aur search query parameters ko load karne ke liye. Aap apne browser sets se cookies delete kar sakte hain, lekin ho sakta hai uske bina user account use karne me thodi problem aaye.
          </Typography>
        </Paper>
      </Stack>
    </Container>
  );
}
