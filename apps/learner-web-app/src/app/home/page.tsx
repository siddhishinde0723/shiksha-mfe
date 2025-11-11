"use client";

import { Box, Button, Typography } from "@mui/material";
import Image from "next/image";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Layout, useTranslation } from "@shared-lib";

export default function Index() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();

  const handleLanguageSelect = (lang: string) => {
    setLanguage(lang);
    // Navigate to login page after language selection
    router.push("/login");
  };

  return (
    <Layout
      onlyHideElements={["footer", "topBar"]}
    >
      {/* Simple Header with Logo and Language Buttons */}
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            zIndex: 1000,
            backgroundColor: "white",
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
               {t("LEARNER_APP.HOME.APP_NAME") || "Welcome to"} 
            </Typography> 
          </Box>

      
      </Box>
      <Suspense fallback={
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                backgroundColor: "white",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                border: "4px solid rgba(253, 190, 22, 0.2)",
              }}
            >
              <Image
                src="/logo.png"
                alt="loading"
                width={40}
                height={40}
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Typography color="#666">{t("LEARNER_APP.COMMON.LOADING") || "Loading..."}</Typography>
          </Box>
        </Box>
      }>
        <Box key={language} display="flex" flexDirection="column" sx={{ wordBreak: "break-word" }}>
          {/* Two Column Layout */}
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              pt: { xs: 8, sm: 10 },
            }}
          >
            {/* Left Column - Content */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: { xs: "flex-start", md: "center" },
                px: { xs: 2, sm: 3, md: 4, lg: 6 },
                py: { xs: 2, sm: 4 },
              }}
            >
              {/* Welcome Title */}
              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#1A1A1A",
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem", lg: "3rem" },
                  mb: { xs: 1.5, sm: 2 },
                  mt: { xs: 2, md: 0 },
                }}
              >
                {t("LEARNER_APP.HOME.WELCOME_TITLE") || "Welcome to"} 
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  fontWeight: 400,
                  color: "#666",
                  fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem", lg: "1.2rem" },
                  lineHeight: 1.6,
                  mb: { xs: 3, sm: 4 },
                  maxWidth: "500px",
                }}
              >
                {t("LEARNER_APP.HOME.MAIN_DESCRIPTION") || "Learn simple, practical finance skills in your language, at your own pace"}
              </Typography>

              {/* Language Selection Section */}
              <Typography
                sx={{
                  fontWeight: 400,
                  color: "#1A1A1A",
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                  mb: { xs: 1.5, sm: 2 },
                }}
              >
                {t("LEARNER_APP.HOME.CHOOSE_LANGUAGE") || "Choose your language"}
              </Typography>

              {/* Language Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 1.5, sm: 2 },
                  mb: { xs: 4, sm: 6 },
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Button
                  onClick={() => handleLanguageSelect("en")}
                  sx={{
                    px: { xs: 3, sm: 4 },
                    py: 1.5,
                    backgroundColor: language === "en" ? "#E6873C" : "#E0E0E0",
                    color: language === "en" ? "#FFFFFF" : "#666666",
                    fontSize: { xs: "14px", sm: "16px" },
                    fontWeight: 400,
                    textTransform: "none",
                    borderRadius: "4px",
                    minWidth: { xs: "100%", sm: "120px" },
                    "&:hover": {
                      backgroundColor: language === "en" ? "#E6873C" : "#D0D0D0",
                    },
                  }}
                >
                  ENGLISH
                </Button>
                <Button
                  onClick={() => handleLanguageSelect("hi")}
                  sx={{
                    px: { xs: 3, sm: 4 },
                    py: 1.5,
                    backgroundColor: language === "hi" ? "#E6873C" : "#E0E0E0",
                    color: language === "hi" ? "#FFFFFF" : "#666666",
                    fontSize: { xs: "14px", sm: "16px" },
                    fontWeight: 400,
                    textTransform: "none",
                    borderRadius: "4px",
                    minWidth: { xs: "100%", sm: "120px" },
                    "&:hover": {
                      backgroundColor: language === "hi" ? "#E6873C" : "#D0D0D0",
                    },
                  }}
                >
                  हिन्दी
                </Button>
              </Box>

              {/* Pagination Dots */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#E6873C",
                  }}
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#E0E0E0",
                  }}
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#E0E0E0",
                  }}
                />
              </Box>
            </Box>

            {/* Right Column - Logo */}
            <Box
              sx={{
                flex: 1,
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                justifyContent: "center",
                px: 4,
                py: 4,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "80%",
                  backgroundColor: "#F5F5F5",
                  border: "1px solid #E0E0E0",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Logo */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    p: 4,
                  }}
                >
                  <Image
                    src="/logo.png"
                    alt="Swadhaar Logo"
                    width={300}
                    height={300}
                    style={{ 
                      objectFit: "contain",
                      maxWidth: "100%",
                      height: "auto",
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Suspense>
    </Layout>
  );
}