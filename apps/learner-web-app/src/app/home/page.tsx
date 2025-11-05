"use client";

import { Box, Button, Container, Typography, Card, CardContent, Grid, alpha } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, Suspense } from "react";
import { Layout, useTranslation } from "@shared-lib";

export default function Index() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const programCarouselRef = useRef<HTMLDivElement>(null);

  const handleScrollToPrograms = () => {
    if (programCarouselRef.current) {
      programCarouselRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Compute features on every render to ensure language changes are reflected
  const features = [
    {
      icon: "🎓",
      title: t("LEARNER_APP.HOME.FEATURES.EDUCATION.TITLE") || "Education",
      description: t("LEARNER_APP.HOME.FEATURES.EDUCATION.DESCRIPTION") || "Learning solutions for institutions"
    },
    {
      icon: "🌱",
      title: t("LEARNER_APP.HOME.FEATURES.AGRICULTURE.TITLE") || "Agriculture",
      description: t("LEARNER_APP.HOME.FEATURES.AGRICULTURE.DESCRIPTION") || "Farmer capacity building"
    },
    {
      icon: "🏥",
      title: t("LEARNER_APP.HOME.FEATURES.HEALTHCARE.TITLE") || "Healthcare",
      description: t("LEARNER_APP.HOME.FEATURES.HEALTHCARE.DESCRIPTION") || "Professional development"
    },
    {
      icon: "⚡",
      title: t("LEARNER_APP.HOME.FEATURES.ALL_DOMAINS.TITLE") || "All Domains",
      description: t("LEARNER_APP.HOME.FEATURES.ALL_DOMAINS.DESCRIPTION") || "Custom learning solutions"
    }
  ];

  return (
    <Layout
      onlyHideElements={["footer"]}
      _topAppBar={{
        _brand: {
          name: "Shiksha",
          _box: {
            onClick: () => router.push("/content"),
            sx: {
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 1,
            },
            _text: {
              fontWeight: 400,
              fontSize: "20px",
              lineHeight: "28px",
              textAlign: "center",
            },
          },
        },
      }}
    >
      <Suspense fallback={
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: "linear-gradient(135deg, #FFFDF7 0%, #F8EFDA 100%)",
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
          {/* Hero Section */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #FFFDF7 0%, #F8EFDA 100%)",
              minHeight: { xs: "85vh", md: "80vh" },
              display: "flex",
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
              py: { xs: 4, md: 0 },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  radial-gradient(circle at 10% 20%, ${alpha('#FDBE16', 0.08)} 0%, transparent 40%),
                  radial-gradient(circle at 90% 80%, ${alpha('#FDBE16', 0.05)} 0%, transparent 40%)
                `,
              }
            }}
          >
            <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
              <Grid container spacing={4} alignItems="center" justifyContent="center">
                {/* Content Section - Always first */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      textAlign: { xs: "center", md: "left" },
                      display: "flex",
                      flexDirection: "column",
                      alignItems: { xs: "center", md: "flex-start" },
                      justifyContent: "center",
                      gap: { xs: 2, md: 2.5 },
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {/* Welcome Title */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 400,
                        color: "#666",
                        letterSpacing: "0.3px",
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        mb: { xs: -1, md: -1 },
                      }}
                    >
                      {t("LEARNER_APP.HOME.WELCOME_TITLE") || "Welcome to"}
                    </Typography>

                    {/* Main Brand Name */}
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color: "#1F1B13",
                        fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.5rem" },
                        lineHeight: 1.1,
                        mb: { xs: 1, md: 1.5 },
                        background: "linear-gradient(135deg, #1F1B13 0%, #333 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {t("LEARNER_APP.HOME.WELCOME_SUBTITLE") || "Swadhaar Finaccess"}
                    </Typography>

                    {/* Main Description */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 400,
                        color: "#555",
                        fontSize: { xs: "0.95rem", sm: "1.05rem" },
                        lineHeight: 1.5,
                        mb: 1.5,
                        maxWidth: "500px",
                      }}
                    >
                      {t("LEARNER_APP.HOME.MAIN_DESCRIPTION") || "Learn simple, practical finance skills in your language, at your own pace"}
                    </Typography>

                    {/* Platform Description */}
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 300,
                        color: "#666",
                        fontSize: { xs: "0.8rem", sm: "0.85rem" },
                        lineHeight: 1.6,
                        mb: { xs: 3, md: 3.5 },
                        maxWidth: "520px",
                        borderLeft: { xs: "none", md: "3px solid #FDBE16" },
                        pl: { xs: 0, md: 2 },
                        py: { xs: 0, md: 0.5 },
                      }}
                    >
                      {t("LEARNER_APP.HOME.PLATFORM_DESCRIPTION") || "A comprehensive platform enabling learning, capacity building, professional development, and content distribution solutions. Applicable across Education, Agriculture, Healthcare, and more."}
                    </Typography>

                    {/* CTA Button */}
                    <Box sx={{ 
                      display: "flex", 
                      gap: 2, 
                      flexWrap: "wrap", 
                      justifyContent: { xs: "center", md: "flex-start" },
                      width: { xs: "100%", sm: "auto" }
                    }}>
                      <Button
                        variant="contained"
                        color="primary"
                        sx={{
                          px: { xs: 4, sm: 5 },
                          py: 1.5,
                          borderRadius: "50px",
                          backgroundColor: "#FDBE16",
                          color: "#1E1B16",
                          fontWeight: 600,
                          fontSize: { xs: "0.9rem", sm: "1rem" },
                          textTransform: "none",
                          boxShadow: "0 4px 12px rgba(253, 190, 22, 0.3)",
                          minWidth: { xs: "160px", sm: "280px" },
                          flex: { xs: 1, sm: 0 },
                          maxWidth: { xs: "200px", sm: "280px" },
                          "&:hover": {
                            backgroundColor: "#F8B500",
                            boxShadow: "0 6px 16px rgba(253, 190, 22, 0.4)",
                            transform: "translateY(-2px)",
                          },
                          transition: "all 0.3s ease",
                        }}
                        onClick={() => router.push("/login")}
                      >
                        {t("LEARNER_APP.HOME.LOGIN_LINK") || "Get Started"}
                      </Button>
                    </Box>

                    {/* Quick Stats */}
                   
                  </Box>
                </Grid>

                {/* Logo Section - Always second */}
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      position: "relative",
                      mb: { xs: 0, md: 0 },
                    }}
                  >
                    {/* Main Logo Container */}
                    <Box
                      sx={{
                        width: { xs: 180, sm: 220, md: 280 },
                        height: { xs: 180, sm: 220, md: 280 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "white",
                        borderRadius: "50%",
                        boxShadow: `
                          0 12px 30px rgba(0, 0, 0, 0.08),
                          0 4px 16px rgba(253, 190, 22, 0.15)
                        `,
                        border: { xs: "8px solid rgba(253, 190, 22, 0.12)", md: "12px solid rgba(253, 190, 22, 0.12)" },
                        position: "relative",
                      }}
                    >
                      <Image
                        src="/logo.png"
                        alt={t("LEARNER_APP.HOME.LOGO_ALT") || "Swadhaar Finaccess Logo"}
                        width={140}
                        height={140}
                        priority
                        style={{ 
                          objectFit: "contain",
                          width: '60%',
                          height: 'auto'
                        }}
                      />
                    </Box>

                    {/* Floating elements */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "10%",
                        right: { xs: "5%", md: "15%" },
                        width: { xs: 40, md: 50 },
                        height: { xs: 40, md: 50 },
                        borderRadius: "50%",
                        backgroundColor: "rgba(253, 190, 22, 0.08)",
                        animation: "float 6s ease-in-out infinite",
                        display: { xs: 'none', sm: 'block' }
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: "15%",
                        left: { xs: "5%", md: "10%" },
                        width: { xs: 30, md: 40 },
                        height: { xs: 30, md: 40 },
                        borderRadius: "50%",
                        backgroundColor: "rgba(253, 190, 22, 0.06)",
                        animation: "float 4s ease-in-out infinite 1s",
                        display: { xs: 'none', sm: 'block' }
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>

          {/* Features Section - Seamlessly connected */}
          <Box
            ref={programCarouselRef}
            sx={{
              py: { xs: 6, md: 7 },
              backgroundColor: "#FAF9F7",
              borderTop: "1px solid rgba(0, 0, 0, 0.05)",
            }}
          >
            <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
              <Box sx={{ textAlign: "center", mb: { xs: 4, md: 5 } }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color: "#1F1B13",
                    mb: 1.5,
                    fontSize: { xs: "1.5rem", sm: "1.8rem", md: "2rem" },
                  }}
                >
                  {t("LEARNER_APP.HOME.OUR_SOLUTIONS_TITLE") || "Our Solutions"}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 400,
                    color: "#666",
                    maxWidth: "500px",
                    mx: "auto",
                    fontSize: { xs: "0.85rem", sm: "0.95rem" },
                    lineHeight: 1.6,
                  }}
                >
                  {t("LEARNER_APP.HOME.OUR_SOLUTIONS_DESC") || "Empowering learning and development across multiple domains with our comprehensive platform"}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {features.map((feature, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      sx={{
                        height: "100%",
                        textAlign: "center",
                        border: "none",
                        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
                        borderRadius: "16px",
                        transition: "all 0.3s ease",
                        backgroundColor: "white",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.12)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                        <Box
                          sx={{
                            fontSize: { xs: "2.5rem", sm: "3rem" },
                            mb: 2,
                            lineHeight: 1,
                          }}
                        >
                          {feature.icon}
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: "#1F1B13",
                            mb: 1.5,
                            fontSize: { xs: "1rem", sm: "1.1rem" },
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#666",
                            lineHeight: 1.5,
                            fontSize: { xs: "0.8rem", sm: "0.85rem" },
                          }}
                        >
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Additional CTA at bottom */}
          
            </Container>
          </Box>

          {/* Floating animation styles */}
          <style jsx global>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-8px) scale(1.02); }
            }
            
            /* Better touch interactions for mobile */
            @media (max-width: 768px) {
              button {
                -webkit-tap-highlight-color: transparent;
              }
              
              /* Improve scrolling performance */
              * {
                -webkit-overflow-scrolling: touch;
              }
            }
          `}</style>
        </Box>
      </Suspense>
    </Layout>
  );
}