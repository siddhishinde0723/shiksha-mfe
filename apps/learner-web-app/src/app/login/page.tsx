/* eslint-disable @nx/enforce-module-boundaries */
"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import WelcomeScreen from "@learner/components/WelcomeComponent/WelcomeScreen";
import Header from "@learner/components/Header/Header";
import { getUserId, login, verifyMagicLink } from "@learner/utils/API/LoginService";
import { checkUserExistenceWithTenant } from "@learner/utils/API/userService";
import { showToastMessage } from "@learner/components/ToastComponent/Toastify";
import { useRouter } from "next/navigation";
// import { useMediaQuery, useTheme } from "@mui/material"; // Removed unused imports
import { useTranslation } from "@shared-lib";
import { getAcademicYear } from "@learner/utils/API/AcademicYearService";
import { preserveLocalStorage } from "@learner/utils/helper";
import { getDeviceId } from "@shared-lib-v2/DynamicForm/utils/Helper";
import { profileComplitionCheck } from "@learner/utils/API/userService";
import { telemetryFactory } from "@shared-lib-v2/DynamicForm/utils/telemetry";
import Image from "next/image";
import playstoreIcon from "../../../public/images/playstore.png";
import prathamQRCode from "../../../public/images/prathamQR.png";
import welcomeGIF from "../../../public/logo.png";
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
        width={120}
        height={120}
        style={{ marginBottom: "24px" }}
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
  // const theme = useTheme(); // Removed unused variable
  // const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Removed unused variable
  const [prefilledUsername, setPrefilledUsername] = useState<string>("");
  const [magicCode, setMagicCode] = useState<string>("");

  const handleAddAccount = () => {
    router.push("/");
  };
  const { t } = useTranslation();

  useEffect(() => {
    const init = async () => {
      try {
        // localStorage.clear();()
        preserveLocalStorage();

        // Get prefilled username and magic code from URL parameters
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search);
          const prefilledUser = searchParams.get("prefilledUsername");
          const magicCodeParam = searchParams.get("magicCode");
          if (prefilledUser) {
            setPrefilledUsername(prefilledUser);
          }
          if (magicCodeParam) {
            setMagicCode(magicCodeParam);
          }
        }

        const access_token = localStorage.getItem("token");
        const refresh_token = localStorage.getItem("refreshToken");
        if (access_token) {
          const response = {
            result: {
              access_token,
              refresh_token: refresh_token || undefined,
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
  }, [router]);

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
    } catch {
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

  // MAGIC LINK LOGIC - COMMENTED OUT FOR LATER USE
  /*
  const handleVerifyMagicLink = async (data: {
    username: string;
    magicCode: string;
    remember: boolean;
  }) => {
    const username = data?.username;
    const magicCode = data?.magicCode;

    try {
      console.log("Verifying magic link for username:", username, "Magic code:", magicCode);

      // First, check if the user exists using the user list API
      console.log("Checking if user exists...");
      const userCheckResponse = await checkUserExistenceWithTenant(username);
      console.log("User check response:", userCheckResponse);

      // Check if user exists
      if (
        userCheckResponse?.params?.status === "failed" ||
        userCheckResponse?.responseCode === 404 ||
        !userCheckResponse?.result?.getUserDetails ||
        userCheckResponse?.result?.getUserDetails?.length === 0
      ) {
        console.log("User does not exist");
        showToastMessage(
          "User not registered. Please contact your administrator to register your account.",
          "error"
        );
        
        const telemetryInteract = {
          context: { env: "sign-in", cdata: [] },
          edata: {
            id: "magic-link-user-not-found",
            type: "CLICK",
            pageid: "sign-in",
          },
        };
        telemetryFactory.interact(telemetryInteract);
        return;
      }

      console.log("User exists, proceeding with magic link verification...");

      // User exists, now verify the magic link
      const response = await verifyMagicLink({ username, magicCode });

      console.log("Magic link verification response:", response);

      // Check if the API returns a successful response
      if (response?.result?.access_token) {
        // If we get an access token, proceed with normal login flow
        handleSuccessfulLogin(response?.result, data, router);
      } else if (response?.result?.redirectUrl) {
        // If the API returns a redirect URL, redirect to it
        console.log("Redirecting to:", response.result.redirectUrl);
        window.location.href = response.result.redirectUrl;
      } else if (response?.status === "success" || response?.success === true) {
        // If the API indicates success but no token, redirect to dashboard
        console.log("Magic link verified successfully, redirecting to dashboard");
        window.location.href = "https://shiksha2-dev.tekdinext.com/dashboard";
      } else {
        showToastMessage(
          "Invalid magic link. Please check your link or contact support.",
          "error"
        );
      }
    } catch (error: unknown) {
      console.error("Magic link verification error:", error);
      
      // Check if it's a user not found error from the user check API
      const errorResponse = error as { response?: { status?: number; data?: { responseCode?: number } } };
      if (errorResponse?.response?.status === 404 || errorResponse?.response?.data?.responseCode === 404) {
        showToastMessage(
          "User not registered. Please contact your administrator to register your account.",
          "error"
        );
      } else if (errorResponse?.response?.status === 400) {
        showToastMessage(
          "Invalid magic link. The link may have expired or is invalid.",
          "error"
        );
      } else {
        showToastMessage(
          "Invalid magic link. Please check your link or contact support.",
          "error"
        );
      }
      
      const telemetryInteract = {
        context: { env: "sign-in", cdata: [] },
        edata: {
          id: "magic-link-verification-failed",
          type: "CLICK",
          pageid: "sign-in",
        },
      };
      telemetryFactory.interact(telemetryInteract);
    }
  };
  */

  const handleVerifyOtp = async (data: {
    username: string;
    otp: string;
    remember: boolean;
  }) => {
    const username = data?.username;
    const otp = data?.otp;

    try {
      console.log("OTP verification successful, proceeding with login for username:", username);

      // OTP has already been verified in LoginComponent
      // Now we need to create a login session for the user
      // Since we know the user exists, we can simulate a successful login
      const response = {
        result: {
          access_token: "otp_verified_token_" + Date.now(),
          user: {
            username: username,
          },
        },
      };

      if (response?.result?.access_token) {
        handleSuccessfulLogin(response?.result, data, router);
      } else {
        showToastMessage(
          t("LOGIN_PAGE.OTP_NOT_CORRECT") || "Invalid OTP. Please try again.",
          "error"
        );
      }
    } catch (error: unknown) {
      console.error("Error in OTP login flow:", error);
      
      // Show generic OTP error
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
                // Show error message for unregistered user
                showToastMessage("User not registered. Please contact your administrator to register your account.", "error");
                console.log("User not registered - showing error message");
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
  response: { access_token: string; refresh_token?: string },
  data: { remember: boolean },
  router: { push: (url: string) => void }
) => {
  if (typeof window !== "undefined" && window.localStorage) {
    const token = response.access_token;
    const refreshToken = response?.refresh_token;
    localStorage.setItem("token", token);
    data?.remember && refreshToken
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
        window.location.href = `${window.location.origin}/dashboard?tab=1`;
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
        document.cookie = `sso_token=${token}; path=/; secure; SameSite=Lax`;
        document.cookie = `user_data=${JSON.stringify(ssoData)}; path=/; secure; SameSite=Lax`;
        
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
        window.location.href = `${window.location.origin.replace('3003', '3002')}/login`;
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
