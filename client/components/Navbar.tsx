import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Chip from '@mui/material/Chip';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import { useState } from 'react';

import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import HowToPlay from './HowToPlay';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Link from 'next/link';
import {
  BookRounded,
  FeedbackRounded,
  Contacts,
  GitHub,
  HomeRounded,
  SmartToyRounded,
} from '@mui/icons-material';

const navItems = [
  { href: '/', label: 'home', icon: <HomeRounded /> },
  { href: 'https://docs.block-empire.com/', label: 'wiki', icon: <BookRounded /> },
  {
    href: 'https://github.com/01MVP/BlockEmpire',
    label: 'github',
    icon: <GitHub />,
  },
  {
    href: 'https://github.com/01MVP/BlockEmpire',
    label: 'bot-api',
    icon: <SmartToyRounded />,
  },
  {
    href: 'https://github.com/01MVP/BlockEmpire/issues',
    label: 'feedback',
    icon: <FeedbackRounded />,
  },
  {
    href: 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=VAwNA8NiYUMsPHrBxLso-t09saGZCT14&authKey=fFpto%2Ff%2FhNUpcxZhSVZt6msLOZrMhW3e14mypEBlO3Ih7PdqOmXq%2FQ0OlV3D%2BuyO&noverify=0&group_code=374889821',
    label: 'qq-group',
    icon: <Contacts />,
  },
];

function Navbar() {
  const [anchorElNav, setAnchorElNav] = useState(null);

  const [show, setShow] = useState(false);

  const toggleShow = () => {
    setShow(!show);
  };

  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (lang: string) => async () => {
    // Note: In App Router, locale switching needs to be implemented differently
    // Typically using middleware or Link component with locale prefixes
    // For now, using simple path-based navigation
    // You may need to adjust this based on your i18n setup
    const currentPath = pathname.replace(/^\/(en|zh)/, '');
    router.push(`/${lang}${currentPath}`);
  };

  const handleOpenNavMenu = (event: any) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar position='fixed' className='navbar'>
      <Container className='dock' sx={{ boxShadow: 3 }}>
        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size='large'
            aria-label='account of current user'
            aria-controls='menu-appbar'
            aria-haspopup='true'
            onClick={handleOpenNavMenu}
            color='inherit'
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link
              href='/'
              style={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}
            >
              <Image
                src='/img/block-empire-logo.png'
                width={100}
                height={17.3}
                alt='Block Empire logo'
              />
            </Link>
          </Box>
          <Menu
            id='menu-appbar'
            anchorEl={anchorElNav}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{
              display: { xs: 'block', md: 'none' },
            }}
          >
            {navItems.map((item) => (
              <MenuItem key={item.href} onClick={handleCloseNavMenu}>
                <Link href={item.href}>
                  <Typography textAlign='center'>
                    {item.label === 'home' && '首页'}
                    {item.label === 'wiki' && '文档'}
                    {item.label === 'github' && 'GitHub'}
                    {item.label === 'bot-api' && '开发机器人'}
                    {item.label === 'feedback' && '反馈'}
                    {item.label === 'qq-group' && 'QQ群'}
                  </Typography>
                </Link>
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            justifyContent: 'space-between',
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link
              href='/'
              style={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}
            >
              <Image
                src='/img/block-empire-logo.png'
                width={100}
                height={17.3}
                alt='Block Empire logo'
              />
            </Link>
          </Box>
          <Box>
            {navItems.map((item) => (
              <Link href={item.href} key={item.href}>
                <Button
                  id='navbar-link'
                  onClick={handleCloseNavMenu}
                  sx={{
                    textTransform: 'none',
                    fontSize: '1rem',
                    marginX: '10px',
                  }}
                  startIcon={item.icon}
                >
                  {item.label === 'home' && '首页'}
                  {item.label === 'wiki' && '文档'}
                  {item.label === 'github' && 'GitHub'}
                  {item.label === 'bot-api' && '开发机器人'}
                  {item.label === 'feedback' && '反馈'}
                  {item.label === 'qq-group' && 'QQ群'}
                </Button>
              </Link>
            ))}
          </Box>
          <Box
            id='lng-selector'
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <Button
              variant='contained'
              size='small'
              onClick={toggleShow}
              sx={{ margin: 2, height: '40px', fontSize: '15px' }}
            >
              <Typography variant='body2' sx={{ whiteSpace: 'nowrap' }}>
                游戏教程
              </Typography>
            </Button>
            <HowToPlay show={show} toggleShow={toggleShow} />
            <FormControl>
              <Select
                color='primary'
                className='navbar-language-switch'
                defaultValue={'zh'}
              >
                {['en', 'zh'].map((lang) => (
                  <MenuItem
                    key={lang}
                    value={lang}
                    onClick={handleClick(lang)}
                  >
                    <Typography>{lang}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* 用户界面 todo */}
        {/* <Box sx={{ flexGrow: 0 }}>
            <Button
              id="navbar-link"
              variant="text"
              color="primary"
              sx={{ color: "white" }}
              onClick={handleOpen}
            >
              {" "}
              {t("navbar-link-clientzone")}{" "}
              <AccountCircleIcon sx={{ ml: 0.4 }} />
            </Button>
          </Box> */}
      </Container>
    </AppBar>
  );
}
export default Navbar;
