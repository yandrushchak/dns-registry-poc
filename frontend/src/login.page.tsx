import { useLogin, useNotify, defaultTheme, ThemeProvider } from 'react-admin';
import { Box, Button } from '@mui/material';
import { createTheme } from '@mui/material/styles';

const LoginPage = () => {
  const login = useLogin();
  const notify = useNotify();

  async function handleConnect() {
    try {
      await login({});
    } catch {
      notify('Connection failed', { type: 'error' });
    }
  }

  return (
    <ThemeProvider theme={createTheme(defaultTheme)}>
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <h1>Login into DNS Registry</h1>
        <Button variant="contained" onClick={handleConnect}>
          Connect MetaMask
        </Button>
      </Box>
    </ThemeProvider>
  );
};

export default LoginPage;
