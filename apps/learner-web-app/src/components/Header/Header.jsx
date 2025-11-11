"use client";

import React, { useState } from "react";
import { Box, Button, Typography, Menu, MenuItem } from "@mui/material";
import Image from "next/image";
import appLogo from "../../../public/logo.png";
import { useTranslation } from "@shared-lib";

const Header = () => {
  const { language, setLanguage } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    handleClose();
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      px={{ xs: 2, sm: 3 }}
      py={{ xs: 1.5, sm: 2 }}
      bgcolor="#fff"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      {/* Logo and Brand Name */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 0.5, sm: 1 },
        }}
      >
        <Box
          sx={{
            width: { xs: 28, sm: 32 },
            height: { xs: 28, sm: 32 },
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src={appLogo}
            alt="Swadhaar"
            width={60}
            height={60}
            style={{ objectFit: "contain" }}
          />
        </Box>
        <Typography
          sx={{
            fontWeight: 400,
            marginLeft: { xs: 1, sm: 2 },
            fontSize: { xs: "16px", sm: "20px" },
            lineHeight: "28px",
                color: "#1A1A1A",
          }}
        >
          Swadhaar
        </Typography>
      </Box>

      {/* Language Selection - Hidden dropdown menu */}
      <Box>
        <Button
          onClick={handleClick}
          sx={{
            minWidth: "auto",
            px: { xs: 1.5, sm: 2 },
            py: 0.75,
            backgroundColor: "#E6873C",
            color: "#FFFFFF",
            fontSize: { xs: "12px", sm: "14px" },
            fontWeight: 400,
            textTransform: "none",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "#D6772C",
            },
          }}
        >
          {language === "en" ? "EN" : "HI"}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem
            onClick={() => handleLanguageChange("en")}
            selected={language === "en"}
            sx={{
              backgroundColor: language === "en" ? "#FFF5E6" : "transparent",
            }}
          >
            ENGLISH
          </MenuItem>
          <MenuItem
            onClick={() => handleLanguageChange("hi")}
            selected={language === "hi"}
            sx={{
              backgroundColor: language === "hi" ? "#FFF5E6" : "transparent",
            }}
          >
            हिन्दी
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Header;
