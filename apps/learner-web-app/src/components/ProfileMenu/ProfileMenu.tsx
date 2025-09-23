/* eslint-disable @nx/enforce-module-boundaries */
import React from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { usePathname } from 'next/navigation';
import SpeakableText from '@shared-lib-v2/lib/textToSpeech/SpeakableText';
import { useTranslation } from '@shared-lib-v2/lib/context/LanguageContext';
const ProfileMenu = ({
  anchorEl,
  open,
  onClose,
  onProfileClick,
  onLogout,
}: any) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 3,
        sx: {
          borderRadius: 2,
          overflow: 'visible',
          width: 280,
          padding: 0,
        },
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ marginTop: '90px' }}
    >
      {/* Profile Section */}
      <MenuItem
        onClick={() => {
          onProfileClick();
          onClose();
        }}
        sx={{
          bgcolor: pathname === '/profile' ? '#f0e5d9' : 'transparent',
          '&:hover': {
            bgcolor: '#e0d6ca',
          },
          py: 1.5,
          px: 2,
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <AccountCircleIcon sx={{ color: '#1e1e1e' }} />
            <Typography variant="body1" fontWeight={500}>
              <SpeakableText>{t('COMMON.GO_TO_MY_PROFILE')}</SpeakableText>
            </Typography>
          </Box>
          <ArrowForwardIosIcon sx={{ fontSize: 16, color: '#1e1e1e' }} />
        </Box>
      </MenuItem>

      <Divider />

      {/* Logout Button */}
      <Box sx={{ px: 2, py: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            onLogout();
            onClose();
          }}
          endIcon={<LogoutIcon />}
          sx={{
            borderRadius: '24px',
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          <SpeakableText>{t('COMMON.LOGOUT')}</SpeakableText>
        </Button>
      </Box>
    </Menu>
  );
};

export default ProfileMenu;
