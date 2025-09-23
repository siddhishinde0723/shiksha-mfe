/* eslint-disable @nx/enforce-module-boundaries */
"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import WelcomeScreen from "@learner/components/WelcomeComponent/WelcomeScreen";
import Header from "@learner/components/Header/Header";
import { getUserId, login } from "@learner/utils/API/LoginService";
import { showToastMessage } from "@learner/components/ToastComponent/Toastify";
import { useRouter } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "@shared-lib";
import { getAcademicYear } from "@learner/utils/API/AcademicYearService";
import { preserveLocalStorage } from "@learner/utils/helper";
import { getDeviceId } from "@shared-lib-v2/DynamicForm/utils/Helper";
import { profileComplitionCheck } from "@learner/utils/API/userService";
import { telemetryFactory } from "@shared-lib-v2/DynamicForm/utils/telemetry";
import Image from "next/image";
import playstoreIcon from "../../../public/images/playstore.png";
import prathamQRCode from "../../../public/images/prathamQR.png";
import welcomeGIF from "../../../public/images/welcome.gif";
import { logEvent } from "@learner/utils/googleAnalytics";

const Login = dynamic(
  () => import("@login/Components/LoginComponent/LoginComponent"),
  {
    ssr: false,
  }
);

const AppDownloadSection = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Grid
      container
      alignItems="center"
      justifyContent="center"
      maxWidth="500px"
    >
      {/* QR Code Section */}
      <Grid item xs={5} sm={5} md={4}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={1}
        >
          <Image
            src={prathamQRCode}
            alt={t("LEARNER_APP.LOGIN.qr_image_alt")}
            width={120}
            height={120}
            style={{ objectFit: "contain" }}
          />
          <Box textAlign="center">
            <Typography fontWeight={600} fontSize="14px">
              {t("LEARNER_APP.LOGIN.GET_THE_APP")}
            </Typography>
            <Typography fontSize="12px" color="textSecondary">
              {t("LEARNER_APP.LOGIN.POINT_YOUR_PHONE")}
              <br />
              {t("LEARNER_APP.LOGIN.POINT_CAMERA")}
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* OR Divider */}
      <Grid
        item
        xs={2}
        sm={2}
        md={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography fontWeight={500} fontSize="14px">
          {t("LEARNER_APP.LOGIN.OR")}
        </Typography>
      </Grid>

      {/* Play Store Section */}
      <Grid item xs={5} sm={5} md={5}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={1}
          sx={{ cursor: "pointer" }}
          onClick={() => {
            router.push(
              "https://play.google.com/store/apps/details?id=com.pratham.learning"
            );
          }}
        >
          <Image
            src={playstoreIcon}
            alt={t("LEARNER_APP.LOGIN.playstore_image_alt")}
            width={100}
            height={32}
          />
          <Box textAlign="center">
            <Typography fontSize="12px" color="textSecondary">
              {t("LEARNER_APP.LOGIN.SEARCH_PLAYSTORE")}
              <br />
              {t("LEARNER_APP.LOGIN.ON_PLAYSTORE")}
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

const WelcomeMessage = () => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
      <Image
        src={welcomeGIF}
        alt={t("LEARNER_APP.LOGIN.welcome_image_alt")}
        width={60}
        height={60}
        style={{ marginBottom: "8px" }}
      />

      <Typography
        fontWeight={400}
        fontSize={{ xs: "24px", sm: "32px" }}
        lineHeight={{ xs: "32px", sm: "40px" }}
        letterSpacing="0px"
        textAlign="center"
        sx={{ verticalAlign: "middle" }}
      >
        {t("LEARNER_APP.LOGIN.welcome_title")}
      </Typography>
      <Typography
        fontWeight={400}
        fontSize={{ xs: "18px", sm: "22px" }}
        lineHeight={{ xs: "24px", sm: "28px" }}
        letterSpacing="0px"
        textAlign="center"
        sx={{ verticalAlign: "middle" }}
        mb={2}
      >
        {t("LEARNER_APP.LOGIN.welcome_subtitle")}
      </Typography>
    </Box>
  );
};

const LoginPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [prefilledUsername, setPrefilledUsername] = useState<string>("");

  const handleAddAccount = () => {
    router.push("/");
  };
  const { t } = useTranslation();

  useEffect(() => {
    const init = async () => {
      try {
        // localStorage.clear();()
        preserveLocalStorage();

        // Get prefilled username from URL parameters
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search);
          const prefilledUser = searchParams.get("prefilledUsername");
          if (prefilledUser) {
            setPrefilledUsername(prefilledUser);
          }
        }

        const access_token = localStorage.getItem("token");
        const refresh_token = localStorage.getItem("refreshToken");
        if (access_token) {
          const response = {
            result: {
              access_token,
              refresh_token,
            },
          };
          handleSuccessfulLogin(response?.result, { remember: false }, router);
        }
        if (!localStorage.getItem("did")) {
          const visitorId = await getDeviceId();
          localStorage.setItem(
            "did",
            typeof visitorId === "string" ? visitorId : ""
          );
          console.log("Device fingerprint generated successfully");
        }
      } catch (error) {
        console.error("Error generating device fingerprint:", error);
      }
    };
    init();
  }, []);

  const handleForgotPassword = () => {
    localStorage.setItem("redirectionRoute", "/login");
    //   router.push('/password-forget?redirectRoute=/login');

    router.push("/password-forget");
  };
  const handleLogin = async (data: {
    username: string;
    password: string;
    remember: boolean;
  }) => {
    const username = data?.username;
    const password = data?.password;
    try {
      const response = await login({ username, password });
      if (response?.result?.access_token) {
        handleSuccessfulLogin(response?.result, data, router);
      } else {
        showToastMessage(
          t("LOGIN_PAGE.USERNAME_PASSWORD_NOT_CORRECT"),
          "error"
        );
        const telemetryInteract = {
          context: { env: "sign-in", cdata: [] },
          edata: {
            id: "login-failed",
            type: "CLICK",
            pageid: "sign-in",
          },
        };
        telemetryFactory.interact(telemetryInteract);
      }
      // setLoading(false);
    } catch (error: any) {
      //   setLoading(false);
      const errorMessage = t("LOGIN_PAGE.USERNAME_PASSWORD_NOT_CORRECT");
      showToastMessage(errorMessage, "error");
      const telemetryInteract = {
        context: { env: "sign-in", cdata: [] },
        edata: {
          id: "login-failed",
          type: "CLICK",
          pageid: "sign-in",
        },
      };
      telemetryFactory.interact(telemetryInteract);
    }
  };

  const handleVerifyOtp = async (data: {
    username: string;
    otp: string;
    remember: boolean;
  }) => {
    const username = data?.username;
    const otp = data?.otp;

    try {
      // TODO: Replace with actual OTP verification API call
      // For now, we'll simulate OTP verification
      console.log("Verifying OTP for username:", username, "OTP:", otp);

      // Simulate API call - replace this with actual OTP verification
      const response = await new Promise<{
        result: { access_token: string; user: { username: string } };
      }>((resolve, reject) => {
        setTimeout(() => {
          // Simulate successful OTP verification
          if (otp && otp.length === 6) {
            resolve({
              result: {
                access_token: "simulated_otp_token",
                user: {
                  username: username,
                  // Add other user details as needed
                },
              },
            });
          } else {
            reject(new Error("Invalid OTP"));
          }
        }, 1000);
      });

      if (response?.result?.access_token) {
        handleSuccessfulLogin(response?.result, data, router);
      } else {
        showToastMessage(
          t("LOGIN_PAGE.OTP_NOT_CORRECT") || "Invalid OTP. Please try again.",
          "error"
        );
      }
    } catch (error: any) {
      const errorMessage =
        t("LOGIN_PAGE.OTP_NOT_CORRECT") || "Invalid OTP. Please try again.";
      showToastMessage(errorMessage, "error");
      const telemetryInteract = {
        context: { env: "sign-in", cdata: [] },
        edata: {
          id: "otp-verification-failed",
          type: "CLICK",
          pageid: "sign-in",
        },
      };
      telemetryFactory.interact(telemetryInteract);
    }
  };
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Box
        //height="100vh"
        // width="100vw"
        display="flex"
        flexDirection="column"
        //  overflow="hidden"
        sx={{
          //  overflowWrap: 'break-word',
          wordBreak: "break-word",
          background: "linear-gradient(135deg, #FFFDF6, #F8EFDA)",
        }}
      >
        {/* Fixed Header */}
        <Header />

        {/* Main Content: Split screen */}
        <Box
          flex={1}
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
        >
          {/* Left: Welcome Screen - Hidden on mobile */}
          <Box
            flex={1}
            display={{ xs: "none", sm: "flex" }}
            justifyContent="center"
            alignItems="center"
            sx={{
              minHeight: { xs: "auto", sm: "100%" },
              py: { xs: 4, sm: 0 },
            }}
          >
            <WelcomeScreen />
          </Box>

          {/* Right: Login Component */}
          <Box
            flex={1}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            px={3}
            boxSizing="border-box"
            sx={{
              minHeight: { xs: "auto", sm: "100%" },
              py: { xs: 2, sm: 0 },
            }}
          >
            {/* Welcome Message - Only visible on mobile */}
            <Box
              display={{ xs: "flex", sm: "none" }}
              justifyContent="center"
              alignItems="center"
              width="100%"
              mb={1}
            >
              <WelcomeMessage />
            </Box>

            <Login
              onLogin={handleLogin}
              onVerifyOtp={handleVerifyOtp}
              handleForgotPassword={handleForgotPassword}
              handleAddAccount={handleAddAccount}
              prefilledUsername={prefilledUsername}
              onRedirectToLogin={() => {
                // Redirect to a different login page or show a message
                showToastMessage("User not found with required access. Please use username/password login.", "error");
                // You can also redirect to a different URL here
                // router.push('/alternative-login');
              }}
            />

            {/* App Download Section - Only visible on mobile */}
            <Box
              display={{ xs: "flex", sm: "none" }}
              justifyContent="center"
              alignItems="center"
              width="100%"
              mt={4}
            >
              <AppDownloadSection />
            </Box>
          </Box>
        </Box>
      </Box>
    </Suspense>
  );
};

export default LoginPage;

const handleSuccessfulLogin = async (
  response: any,
  data: { remember: boolean },
  router: any
) => {
  if (typeof window !== "undefined" && window.localStorage) {
    const token = response.access_token;
    const refreshToken = response?.refresh_token;
    localStorage.setItem("token", token);
    data?.remember
      ? localStorage.setItem("refreshToken", refreshToken)
      : localStorage.removeItem("refreshToken");

    const userResponse = await getUserId();

    if (userResponse) {
      const userRole = userResponse?.tenantData?.[0]?.roleName;
      
      // Handle Learner role - redirect to learner dashboard
      if (userRole === "Learner") {
        localStorage.setItem("userId", userResponse?.userId);
        localStorage.setItem(
          "templtateId",
          userResponse?.tenantData?.[0]?.templateId
        );
        localStorage.setItem("userIdName", userResponse?.username);
        localStorage.setItem("firstName", userResponse?.firstName || "");

        const tenantId = userResponse?.tenantData?.[0]?.tenantId;
        const tenantName = userResponse?.tenantData?.[0]?.tenantName;
        const uiConfig = userResponse?.tenantData?.[0]?.params?.uiConfig;

        localStorage.setItem("uiConfig", JSON.stringify(uiConfig || {}));

        localStorage.setItem("tenantId", tenantId);
        localStorage.setItem("userProgram", tenantName);
        await profileComplitionCheck();
        if (tenantName === "YouthNet") {
          const academicYearResponse = await getAcademicYear();
          if (academicYearResponse[0]?.id) {
            localStorage.setItem("academicYearId", academicYearResponse[0]?.id);
          }
        }
        const telemetryInteract = {
          context: { env: "sign-in", cdata: [] },
          edata: {
            id: "login-success",
            type: "CLICK",
            pageid: "sign-in",
            uid: userResponse?.userId || "Anonymous",
          },
        };
        telemetryFactory.interact(telemetryInteract);

        const channelId = userResponse?.tenantData?.[0]?.channelId;
        localStorage.setItem("channelId", channelId);

        const collectionFramework =
          userResponse?.tenantData?.[0]?.collectionFramework;
        localStorage.setItem("collectionFramework", collectionFramework);

        document.cookie = `token=${token}; path=/; secure; SameSite=Strict`;
        const query = new URLSearchParams(window.location.search);
        const redirectUrl = query.get("redirectUrl");
        const activeLink = query.get("activeLink");
        if (redirectUrl && redirectUrl.startsWith("/")) {
          router.push(
            `${redirectUrl}${activeLink ? `?activeLink=${activeLink}` : ""}`
          );
        }
        logEvent({
          action: "successfully-login-in-learner-app",
          category: "Login Page",
          label: "Login Button Clicked",
        });
        
        // Redirect to learner dashboard with tab=1
        window.location.href = "http://localhost:3003/dashboard?tab=1";
        return;
      }
      
      // Handle Creator, Reviewer, Admin roles - redirect to admin portal with SSO
      else if (userRole === "Creator" || userRole === "Reviewer" || userRole === "Admin") {
        // Store user data for SSO
        localStorage.setItem("userId", userResponse?.userId);
        localStorage.setItem("userIdName", userResponse?.username);
        localStorage.setItem("firstName", userResponse?.firstName || "");
        localStorage.setItem("userRole", userRole);
        
        const tenantId = userResponse?.tenantData?.[0]?.tenantId;
        const tenantName = userResponse?.tenantData?.[0]?.tenantName;
        localStorage.setItem("tenantId", tenantId);
        localStorage.setItem("userProgram", tenantName);
        
        // Create SSO token for admin portal
        const ssoData = {
          token: token,
          userId: userResponse?.userId,
          username: userResponse?.username,
          firstName: userResponse?.firstName,
          role: userRole,
          tenantId: tenantId,
          tenantName: tenantName,
          timestamp: Date.now()
        };
        
        // Store SSO data in localStorage for cross-domain access
        localStorage.setItem("ssoData", JSON.stringify(ssoData));
        
        // Set cookie for admin portal
        document.cookie = `sso_token=${token}; path=/; domain=localhost; secure; SameSite=Lax`;
        document.cookie = `user_data=${JSON.stringify(ssoData)}; path=/; domain=localhost; secure; SameSite=Lax`;
        
        const telemetryInteract = {
          context: { env: "sign-in", cdata: [] },
          edata: {
            id: "login-success-admin",
            type: "CLICK",
            pageid: "sign-in",
            uid: userResponse?.userId || "Anonymous",
          },
        };
        telemetryFactory.interact(telemetryInteract);
        
        logEvent({
          action: "successfully-login-admin-redirect",
          category: "Login Page",
          label: "Admin Login Redirect",
        });
        
        // Redirect to admin portal with SSO
        window.location.href = "http://localhost:3002/login";
        return;
      }
      
      // Handle unknown roles
      else {
        showToastMessage("User role not recognized. Please contact administrator.", "error");
        const telemetryInteract = {
          context: { env: "sign-in", cdata: [] },
          edata: {
            id: "login-failed-unknown-role",
            type: "CLICK",
            pageid: "sign-in",
          },
        };
        telemetryFactory.interact(telemetryInteract);
      }
    }
  }
};
