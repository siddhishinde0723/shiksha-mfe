"use client";

import { Box, Button, Container, Grid, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, Suspense } from "react";
import { Layout, useTranslation } from "@shared-lib";
import OurProgramCarousel from "@learner/components/OurProgramCarousel";
import { checkAuth } from "@shared-lib-v2/utils/AuthService";

export default function Index() {
  const router = useRouter();
  const { t } = useTranslation();
  const programCarouselRef = useRef<HTMLDivElement>(null);

  const handleScrollToPrograms = () => {
    if (programCarouselRef.current) {
      programCarouselRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Layout
      onlyHideElements={["footer"]}
      _topAppBar={{
        _brand: {
          name:"Swadhaar",
            
          // logo:  "/images/appLogo.svg",
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
              fontSize: "22px",
              lineHeight: "28px",
              textAlign: "center",
            },
          },
        },
      }}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <Box
          display="flex"
          flexDirection="column"
          sx={{ overflowWrap: "break-word", wordBreak: "break-word" }}
        >
          {/* <Header /> */}

          <Box
            sx={{
              background: "linear-gradient(180deg, #FFFDF7 0%, #F8EFDA 100%)",
              boxShadow: "0px 4px 8px 3px #00000026, 0px 1px 3px 0px #0000004D",
              pt: "20px",
            }}
          >
            <Container>
              <Box
                sx={{
                  textAlign: "center",
                  my: { xs: 2, sm: 4 },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: { xs: 1, sm: 2 },
                  width: "100%",
                  px: { xs: 2, sm: 0 },
                  maxWidth: "100%",
                }}
              >
                <Box
                  sx={{
                    width: { xs: 120, sm: 120 },
                    height: { xs: 120, sm: 120 },
                    position: "relative",
                  }}
                >
                  <Image
                    src="/logo.png"
                    alt="welcome gif"
                    width={120}
                    height={120}
                    style={{ marginBottom: "24px" }}
                  />
                </Box>
                <Typography
                  variant="body9"
                  component="h1"
                  sx={{
                    fontWeight: "400",
                    color: "#1F1B13",
                    textAlign: "center",
                  }}
                >
                  {t("LEARNER_APP.HOME.WELCOME_TITLE")}
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: "400",
                    textAlign: "center",
                  }}
                >
                  {t("LEARNER_APP.HOME.WELCOME_SUBTITLE")}
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  sx={{
                    mt: 2,
                    px: 4,
                    py: 1,
                    borderRadius: "100px",
                    backgroundColor: "#FDBE16",
                    color: "#1E1B16",
                    fontWeight: "500",
                    fontSize: "16px",
                    "&:hover": {
                      backgroundColor: "#FDBE16",
                    },
                  }}
                  onClick={() => router.push("/login")}
                >
                  {t("LEARNER_APP.HOME.LOGIN_LINK")}
                </Button>

                <Box sx={{ display: "flex", gap: "5px" }}>
                  {/* <Typography variant="body2" color="#1F1B13" display="inline">
                    {t("LEARNER_APP.HOME.ALREADY_SIGNED_UP")}
                  </Typography> */}
                  {/* <Typography
                    variant="body2"
                    color="#0D599E"
                    sx={{
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontWeight: "500",
                    }}
                    display="inline"
                    onClick={() => router.push("/login")}
                  >
                    {t("LEARNER_APP.HOME.LOGIN_LINK")}
                  </Typography> */}
                </Box>
              </Box>
            </Container>
            {/* <Box sx={{ background: '#fff', py: '4px', borderRadius: '24px' }}>
              <Container maxWidth="md">
                <Grid
                  container
                  spacing={2}
                  sx={{ my: 4, alignItems: 'center' }}
                >
                  <Grid item xs={12} sm={5}>
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: '15px',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Image
                            src="/images/prathamQR.png"
                            alt="QR Code"
                            width={100}
                            height={100}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="h3"
                            sx={{
                              textAlign: 'left',
                              color: '#1F1B13',
                              fontWeight: '500',
                            }}
                            fontWeight="bold"
                          >
                            {t('LEARNER_APP.HOME.GET_THE_APP')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('LEARNER_APP.HOME.POINT_CAMERA')}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                      }}
                    >
                      <Box
                        sx={{
                          width: '1px',
                          height: '20px',
                          backgroundColor: '#D9D9D9',
                        }}
                      />
                      <Typography
                        variant="h4"
                        sx={{
                          my: 1,
                          color: '#1F1B13',
                          fontWeight: '400',
                        }}
                      >
                        {t('LEARNER_APP.HOME.OR')}
                      </Typography>
                      <Box
                        sx={{
                          width: '1px',
                          height: '20px',
                          backgroundColor: '#D9D9D9',
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1,
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        router.push(
                          'https://play.google.com/store/apps/details?id=com.pratham.learning'
                        );
                      }}
                    >
                      <Box>
                        <img
                          src="/images/playstore.png"
                          alt="Play Store"
                          width="122"
                        />
                      </Box>
                      <Box>
                        <Typography>
                          {t('LEARNER_APP.HOME.SEARCH_PLAYSTORE')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Container>
            </Box> */}
          </Box>

          {/* <Container maxWidth="xl">
            <Box sx={{ my: 6, px: "20px" }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Typography
                    variant="body9"
                    component="h2"
                    fontWeight="bold"
                    sx={{
                      mb: 3,
                      fontWeight: 600,
                      color: "#1F1B13",
                    }}
                  >
                    {t("LEARNER_APP.HOME.ABOUT_PRATHAM_TITLE")}
                  </Typography>
                  <Typography
                    variant="body1"
                    component="h1"
                    paragraph
                    sx={{
                      mb: 3,
                      fontWeight: 400,
                      color: "#1F1B13",
                    }}
                  >
                    {t("LEARNER_APP.HOME.ABOUT_PRATHAM_DESC")}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: 278,
                      borderRadius: "24px",
                      overflow: "hidden",
                    }}
                  >
                    <iframe
                      width="100%"
                      height="100%"
                      src="https://www.youtube.com/embed/GHDXLXVgH-E?si=96TpyN_qbCfF2V4T"
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      style={{ borderRadius: "24px" }}
                    ></iframe>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Container> */}

          {/* <Box
            ref={programCarouselRef}
            sx={{
              background: "linear-gradient(180deg, #FFFDF7 0%, #F8EFDA 100%)",
              padding: "20px",
            }}
          >
            <OurProgramCarousel />
          </Box> */}
        </Box>
      </Suspense>
    </Layout>
  );
}
