'use client';

import React from 'react';
import { Container, Typography, Box, Paper, Stack, Avatar } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';

export default function TermsAndConditionsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      {/* Header section */}
      <Box textAlign="center" mb={6}>
        <Avatar sx={{ bgcolor: 'warning.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
          <GavelIcon sx={{ fontSize: 36, color: 'white' }} />
        </Avatar>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Terms & Conditions
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight="normal">
          Rewa Bhoomi use karne se pehle rules aur guidelines ko dhyan se padhein.
        </Typography>
      </Box>

      {/* Main Content */}
      <Stack spacing={4}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom color="warning.dark">
            1. Platform Use Karne Ki Shartein (Eligibility)
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569' }}>
            Rewa Bhoomi par register karne ke liye aapki age kam se kam <strong>18 saal</strong> honi chahiye. Agar aap kisi aur ke behalf par (jaise client ya relative) property post kar rahe hain, toh aapke paas unki legal permission honi zaroori hai.
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom color="warning.dark">
            2. Property Listings Ke Rules (Listing Policy)
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569', mb: 2 }}>
            Sellers aur Landlords ko hamare platform par properties upload karte waqt niche likhi baatein follow karni hongi:
          </Typography>
          <Typography variant="body1" component="div" sx={{ lineHeight: 1.8, color: '#475569' }}>
            <ul>
              <li><strong>Sahi Details:</strong> Property ka address, price, dimensions (bigha, square feet) aur details bilkul sach honi chahiye.</li>
              <li><strong>Original Photos:</strong> Kisi dusri property ya internet se copy ki gayi photos upload na karein.</li>
              <li><strong>Spam Listings:</strong> Ek hi property ko baar-baar upload karke list spam karne par account permanently block kiya ja sakta hai.</li>
            </ul>
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFBEB' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom color="warning.dark">
            3. Deal Aur Verification (Legal Warning)
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569' }}>
            <strong>Important Alert:</strong> Rewa Bhoomi sirf ek bridge (platform) hai jo buyers aur sellers ko connect karta hai. Hum offline transactions, paper registry, bhu-naksha check, ya property disputed ownership ki guarantee nahi lete. 
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569', mt: 2 }}>
            Registry karne ya token money dene se pehle land registry records (जैसे Khasra/Khatauni) tehsil office se khud verify zaroori karein. Kisi bhi tarah ke online fraud ya jhoothe transaction ke liye hum zimmedar nahi honge.
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom color="warning.dark">
            4. Brokerage & Services (Fees Structure)
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569' }}>
            Hamara core platform bilkul free hai, matlab direct contact karne ke liye koi commission ya brokerage charge nahi liya jata. Halanki, future me premium listings ko top index par rakhne ya maps feature use karne ke liye small subscription fees rakhi ja sakti hai, jo ki website par clearly notify ki jayegi.
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom color="warning.dark">
            5. Account Suspension (Ban Rules)
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569' }}>
            Hum rules breach karne wale accounts (jaise fake phone numbers, abusive chat/messages, abusive behaviour) ko suspend karne ka adhikar rakhte hain. Hamare platform ka mis-use karne par local legal actions bhi liye ja sakte hain.
          </Typography>
        </Paper>
      </Stack>
    </Container>
  );
}
