import { Avatar, Box, Typography, Button, TextField } from '@mui/material';
import Image from 'next/image';

import { useState } from 'react';

interface LoginProps {
  username: string;
  handlePlayClick: (username: string) => void;
}

const Login: React.FC<LoginProps> = (props) => {
  const { username, handlePlayClick } = props;
  const [inputName, setInputName] = useState('Anonymous');

  const handleUsernameChange = (event: any) => {
    setInputName(event.target.value);
  };
  const handleInputKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      handlePlayClick(inputName);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <Avatar
          className='menu-container'
          src='/img/favicon.png'
          sx={{
            width: { xs: '8rem', md: '10rem' },
            height: { xs: '8rem', md: '10rem' },
            borderRadius: 5,
            boxShadow: 2,
            zIndex: 100,
          }}
        />
        <Box
          className='menu-container'
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: '80dvw', md: '40dvw' },
            marginTop: '-40px !important',
            zIndex: '10 !important',
            boxShadow: 1
          }}
        >
          <Typography variant='h4' color='primary' sx={{ padding: 4 }}>
            登录方块帝国
          </Typography>
          <TextField
            sx={{ width: '100%' }}
            id='outlined-basic'
            placeholder='输入用户名，不超过 15 个字符'
            // value={inputName}
            color='primary'
            focused
            variant='filled'
            inputProps={{ min: 0, style: { textAlign: 'center' } }}
            hiddenLabel
            onChange={handleUsernameChange}
            onKeyDown={handleInputKeyDown}
          />
          <Button
            variant='contained'
            onClick={() => handlePlayClick(inputName)}
            sx={{ margin: 2, width: '100%', height: '40px', fontSize: '15px' }}
          >
            开始游戏
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default Login;
