const fs = require('fs');
const file = 'f:/FreelanceWork/REWA-bhoomi/apps/web/src/features/profile/ProfilePage.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchRegex = /<Grid container spacing=\{\{ xs: 2, md: 4 \}\}>[\s\S]*?<Grid item xs=\{12\} md=\{8\}>\s*<Paper elevation=\{0\} sx=\{\{ p: \{\s*xs:\s*2,\s*sm:\s*3\s*\}, borderRadius: \{\s*xs:\s*3,\s*md:\s*4\s*\}, border: '1px solid #E2E8F0', minHeight: \{\s*xs:\s*300,\s*md:\s*500\s*\} \}\}>/m;

const replacement = `<Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 4 } }}>
          <Paper elevation={0} sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, md: 4 }, pb: 0, borderRadius: { xs: 3, md: 4 }, border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', textAlign: { xs: 'center', md: 'left' }, gap: { xs: 2, md: 4 } }}>
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  src={currentAvatarUrl || undefined}
                  sx={{ width: { xs: 80, md: 100 }, height: { xs: 80, md: 100 }, border: '3px solid white', boxShadow: '0 6px 18px rgba(0,0,0,0.1)' }}
                >
                  {!currentAvatarUrl && user.name.charAt(0).toUpperCase()}
                </Avatar>
                <input
                  accept="image/*"
                  type="file"
                  id="avatar-upload"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
                <label htmlFor="avatar-upload">
                  <IconButton
                    component="span"
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: '#1B4FD8',
                      color: 'white',
                      p: { xs: 0.5, md: 0.8 },
                      '&:hover': { bgcolor: '#1D4ED8' },
                      boxShadow: '0 4px 10px rgba(27, 79, 216, 0.4)'
                    }}
                    disabled={isUploading}
                  >
                    {isUploading ? <CircularProgress size={16} color="inherit" /> : <PhotoCamera sx={{ fontSize: { xs: 16, md: 20 } }} />}
                  </IconButton>
                </label>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={700} color="#0F172A" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                  {user.name}
                </Typography>
                <Typography variant="body1" color="#64748B" sx={{ mb: 1 }}>
                  {user.email}
                </Typography>
                <Box sx={{ display: 'inline-flex', px: 1.5, py: 0.2, bgcolor: 'rgba(27, 79, 216, 0.1)', color: '#1B4FD8', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>
                  {user.roles.includes('ADMIN') ? 'ADMINISTRATOR' : 'USER'}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mt: { xs: 3, md: 4 }, mb: 0 }} />
            
            <Tabs
              orientation="horizontal"
              variant={isMobile ? 'scrollable' : 'fullWidth'}
              scrollButtons="auto"
              allowScrollButtonsMobile
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                borderBottom: 0,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: { xs: 1.5, md: 2 },
                  px: { xs: 2, md: 3 },
                  borderRadius: 0,
                  fontSize: { xs: '0.75rem', md: '0.95rem' },
                  minHeight: { xs: 48, md: 60 },
                  whiteSpace: 'nowrap',
                  borderBottom: '3px solid transparent',
                  flexDirection: 'row',
                  gap: 1,
                  color: '#64748B',
                  fontWeight: 600
                },
                '& .Mui-selected': { 
                  color: '#1B4FD8 !important', 
                  borderBottomColor: '#1B4FD8'
                }
              }}
            >
              <Tab icon={<Person sx={{ fontSize: { xs: 20, md: 22 } }} />} label="Profile Details" />
              <Tab icon={<Security sx={{ fontSize: { xs: 20, md: 22 } }} />} label="Security" />
              <Tab icon={<MapsHomeWork sx={{ fontSize: { xs: 20, md: 22 } }} />} label="My Properties" />
              <Tab icon={<Favorite sx={{ color: '#EF4444', fontSize: { xs: 20, md: 22 } }} />} label="Saved Properties" />
            </Tabs>
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: { xs: 3, md: 4 }, border: '1px solid #E2E8F0', minHeight: { xs: 300, md: 500 } }}>`;

if (searchRegex.test(content)) {
  const newContent = content.replace(searchRegex, replacement);
  // Also fix the bottom tags
  const finalContent = newContent.replace(/<\/Grid>\s*<\/Grid>\s*<\/Container>/m, '</Paper>\n        </Box>\n      </Container>');
  fs.writeFileSync(file, finalContent);
  console.log("Successfully replaced!");
} else {
  console.log("Regex didn't match.");
}
