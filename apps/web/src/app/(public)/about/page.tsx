'use client';

import React from 'react';
import { Container, Typography, Box, Grid, Paper, Avatar, Stack } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import GroupsIcon from '@mui/icons-material/Groups';
import HandshakeIcon from '@mui/icons-material/Handshake';

export default function AboutPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      {/* Header section */}
      <Box textAlign="center" mb={6}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
          <InfoIcon sx={{ fontSize: 36 }} />
        </Avatar>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          About Rewa Bhoomi
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight="normal">
          Rewa ke logo ke liye, Rewa ke hi property search ko aasan aur digital banane ki ek koshish!
        </Typography>
      </Box>

      {/* Main Content */}
      <Stack spacing={4}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom color="primary.main">
            Hum Kaun Hain? (Who We Are)
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569' }}>
            <strong>Rewa Bhoomi</strong> ek modern real estate platform hai jo specially <strong>Rewa (Madhya Pradesh)</strong> ke logon ke liye banaya gaya hai. Hum samajhte hain ki Rewa me sahi plot, ghar ya flat dhoodhna kitna bada jhanjhat ka kaam hota hai. Baar-baar brokers ke chakkar lagana, extra brokerage fees dena, aur bina security ke transactions karna ab purana tarika ho chuka hai. 
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#475569', mt: 2 }}>
            Isiliye humne banaya hai ek direct platform jahan property owners aur buyers aamne-saamne baithkar deal kar sakte hain. Humara aim hai ki Rewa ke har kone (bhalai wo Bodabag ho, Urahata, Sirmour Chauraha ya Naya Harraur) ki property online register ho aur aap ghar baithe hi use explore kar sakein.
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <GroupsIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Humara Mission</Typography>
              </Box>
              <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#475569' }}>
                Humara simple mission hai: <strong>"Bina brokerage, direct property deal"</strong>. Rewa ke local real estate market ko fully transparent banana aur technology ki madad se buyers aur sellers ke beech ki doori ko kam karna taaki aapka time aur paisa dono bach sakein.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <HandshakeIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Humara Vaada</Typography>
              </Box>
              <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#475569' }}>
                Hum aapko ek safe environment dete hain jahan aap real listings aur verified information dekh sakte hain. Hamari support team aapki digital property journey ko clean aur user-friendly rakhne ke liye hamesha ready rehti hai.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Kyu Chune Rewa Bhoomi?
          </Typography>
          <Typography variant="body1" component="div" sx={{ lineHeight: 1.8, color: '#475569' }}>
            <ul>
              <li><strong>Local Rewa Focus:</strong> Hum kisi metro city ke liye nahi, balki exclusive Rewa region aur uske aaspas ki properties par focus karte hain.</li>
              <li><strong>Direct Deal:</strong> Koi teesra banda ya broker beech me nahi hoga. Aap direct owner se baat kijiye.</li>
              <li><strong>Easy to Use:</strong> Mobile aur website dono par aasaani se chalne wala responsive design, taaki aap asani se photo aur documents dekh sakein.</li>
              <li><strong>Advanced Map Integration:</strong> Humne properties aur projects ke liye dedicated map view lagaya hai taaki aap location asani se samajh sakein.</li>
            </ul>
          </Typography>
        </Paper>
      </Stack>
    </Container>
  );
}
