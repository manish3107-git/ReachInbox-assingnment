import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Typography, Container, Paper, AppBar, Toolbar, Button } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              ReachInbox
            </Typography>
            <Button color="inherit" href="/">Dashboard</Button>
            <Button color="inherit" href="/emails">Emails</Button>
            <Button color="inherit" href="/search">Search</Button>
            <Button color="inherit" href="/analytics">Analytics</Button>
            <Button color="inherit" href="/settings">Settings</Button>
          </Toolbar>
        </AppBar>
        
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="xl">
            <Routes>
              <Route path="/" element={
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h4" gutterBottom>
                    Welcome to ReachInbox
                  </Typography>
                  <Typography variant="body1">
                    Your AI-powered email aggregator is ready!
                  </Typography>
                </Paper>
              } />
              <Route path="/emails" element={
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h4" gutterBottom>
                    Email List
                  </Typography>
                  <Typography variant="body1">
                    Email management features coming soon...
                  </Typography>
                </Paper>
              } />
              <Route path="/search" element={
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h4" gutterBottom>
                    Search
                  </Typography>
                  <Typography variant="body1">
                    Advanced search features coming soon...
                  </Typography>
                </Paper>
              } />
              <Route path="/analytics" element={
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h4" gutterBottom>
                    Analytics
                  </Typography>
                  <Typography variant="body1">
                    Email analytics coming soon...
                  </Typography>
                </Paper>
              } />
              <Route path="/settings" element={
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h4" gutterBottom>
                    Settings
                  </Typography>
                  <Typography variant="body1">
                    Configuration options coming soon...
                  </Typography>
                </Paper>
              } />
            </Routes>
          </Container>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;