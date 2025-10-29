import React from 'react';
import { Box, Backdrop, CircularProgress, Typography } from '@mui/material';

interface GameLoadingProps {}

const GameLoading: React.FC<GameLoadingProps> = (props) => {
  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open
    >
      <Box
        sx={{
          width: '200px',
          height: '100px',
          display: 'flex',
          background: 'transparent',
          alignItems: 'center!important',
          justifyContent: 'center!important',
        }}
      >
        <CircularProgress size={30} />
        <Typography variant='body1' sx={{ marginX: 1 }}>
          游戏加载中...
        </Typography>
      </Box>
    </Backdrop>
  );
};

export default GameLoading;
