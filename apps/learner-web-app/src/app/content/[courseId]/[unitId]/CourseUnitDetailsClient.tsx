"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Layout from "@learner/components/Layout";
import { Box, Button, Typography, IconButton } from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import Image from "next/image";
import { useTranslation } from "@shared-lib";
import ProfileMenu from "@learner/components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "@learner/components/ConfirmationModal/ConfirmationModal";
import { useRouter } from "next/navigation";

const CourseUnitDetails = dynamic(() => import("@CourseUnitDetails"), {
  ssr: false,
});

const CourseUnitDetailsClient: React.FC = () => {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const handleProfileClick = () => {
    router.push("/profile");
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
    setAnchorEl(null);
  };

  const performLogout = () => {
    router.push("/logout");
  };

  return (
    <Layout onlyHideElements={["footer", "topBar"]}>
      {/* Custom Header with Logo, Language, and Profile */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          zIndex: 1000,
          borderBottom: "1px solid #E0E0E0",
        }}
      >
        {/* Top Header Bar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
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
                src="/logo.png"
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
              {t("LEARNER_APP.HOME.APP_NAME") || "Swadhaar"}
            </Typography>
          </Box>

          {/* Language Buttons and Profile */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Button
              onClick={() => setLanguage("en")}
              sx={{
                minWidth: "auto",
                px: 2,
                py: 0.75,
                backgroundColor: language === "en" ? "#E6873C" : "#E0E0E0",
                color: language === "en" ? "#FFFFFF" : "#666666",
                fontSize: "16px",
                fontWeight: 500,
                textTransform: "none",
                borderRadius: "4px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: language === "en" ? "#D6772C" : "#D0D0D0",
                },
                "&:focus": {
                  backgroundColor: language === "en" ? "#D6772C" : "#D0D0D0",
                  boxShadow: language === "en" ? "0 0 0 3px rgba(230, 135, 60, 0.2)" : "none",
                },
              }}
            >
              ENGLISH
            </Button>
            <Button
              onClick={() => setLanguage("hi")}
              sx={{
                minWidth: "auto",
                px: 2,
                py: 0.75,
                backgroundColor: language === "hi" ? "#E6873C" : "#E0E0E0",
                color: language === "hi" ? "#FFFFFF" : "#666666",
                fontSize: "16px",
                fontWeight: 500,
                textTransform: "none",
                borderRadius: "4px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: language === "hi" ? "#D6772C" : "#D0D0D0",
                },
                "&:focus": {
                  backgroundColor: language === "hi" ? "#D6772C" : "#D0D0D0",
                  boxShadow: language === "hi" ? "0 0 0 3px rgba(230, 135, 60, 0.2)" : "none",
                },
              }}
            >
              हिन्दी
            </Button>
            {/* Profile Icon Button */}
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                color: "#1A1A1A",
                "&:hover": {
                  backgroundColor: "rgba(230, 135, 60, 0.1)",
                },
              }}
            >
              <AccountCircle sx={{ fontSize: { xs: 28, sm: 32 } }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          pt: { xs: 12, sm: 14 },
          minHeight: "100vh",
          backgroundColor: "#F5F5F5",
          pb: 4,
        }}
      >
        <CourseUnitDetails
          isShowLayout={false}
          _config={{
            default_img: "/images/image_ver.png",
            _card: { isHideProgress: true },
            _infoCard: {
              _cardMedia: { maxHeight: { xs: "200px", sm: "280px" } },
              default_img: "/images/unit.png",
            },
          }}
        />
      </Box>

      <ProfileMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onProfileClick={handleProfileClick}
        onLogout={handleLogoutClick}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        modalOpen={logoutModalOpen}
        message={t("COMMON.SURE_LOGOUT")}
        handleAction={performLogout}
        buttonNames={{
          primary: t("COMMON.LOGOUT"),
          secondary: t("COMMON.CANCEL"),
        }}
        handleCloseModal={() => setLogoutModalOpen(false)}
      />
    </Layout>
  );
};

export default CourseUnitDetailsClient;

