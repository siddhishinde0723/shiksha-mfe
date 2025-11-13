/* eslint-disable @nx/enforce-module-boundaries */
"use client";

import React, {
  Suspense,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Paper,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import WelcomeScreen from "@learner/components/WelcomeComponent/WelcomeScreen";
import Header from "@learner/components/Header/Header";
import { getUserId, login } from "@learner/utils/API/LoginService";
import { checkUserExistenceWithTenant } from "@learner/utils/API/userService";
import { sendOTP, verifyOTP } from "@learner/utils/API/OtPService";
import { showToastMessage } from "@learner/components/ToastComponent/Toastify";
import { useRouter } from "next/navigation";
import { useTranslation } from "@shared-lib";
import { preserveLocalStorage } from "@learner/utils/helper";
import { getDeviceId } from "@shared-lib-v2/DynamicForm/utils/Helper";
import { profileComplitionCheck } from "@learner/utils/API/userService";
import { telemetryFactory } from "@shared-lib-v2/DynamicForm/utils/telemetry";
import Image from "next/image";
import playstoreIcon from "../../../public/images/playstore.png";
import prathamQRCode from "../../../public/images/prathamQR.png";
import welcomeGIF from "../../../public/logo.png";
import { logEvent } from "@learner/utils/googleAnalytics";
import {
  ensureAcademicYearForTenant,
  getTenantInfo,
} from "@learner/utils/API/ProgramService";

// Helper function to get cookie value
const getCookieValue = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

// Inline Login Component
interface LoginComponentProps {
  onLogin: (data: {
    username: string;
    password: string;
    remember: boolean;
  }) => void;
  onVerifyOtp?: (data: {
    username: string;
    otp: string;
    remember: boolean;
    hash: string;
  }) => void;
  handleAddAccount?: () => void;
  handleForgotPassword?: () => void;
  prefilledUsername?: string;
  onRedirectToLogin?: () => void;
}

const LoginComponent: React.FC<LoginComponentProps> = ({
  onLogin,
  onVerifyOtp,
  handleAddAccount,
  handleForgotPassword,
  prefilledUsername,
  onRedirectToLogin,
}) => {
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [forcePasswordMode, setForcePasswordMode] = useState(false);
  const [hasCheckedUser, setHasCheckedUser] = useState(false);
  const [lastCallTime, setLastCallTime] = useState(0);
  const [otpHash, setOtpHash] = useState<string>("");
  const hasInitializedRef = useRef(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    otp: "",
    remember: false,
  });

  // Check if username is a mobile number (10+ digits)
  const isMobileNumber = (username: string) => {
    return /^\d{10,}$/.test(username);
  };

  // Process mobile number to handle country code
  const processMobileNumber = (mobile: string): string => {
    // Check if it's a 12-digit number starting with 91 (India country code)
    if (mobile.length === 12 && mobile.startsWith("91")) {
      return mobile.substring(2); // Remove the first 2 digits (91)
    }
    return mobile;
  };

  // Determine if we should show OTP mode
  const isOtpMode =
    prefilledUsername &&
    isMobileNumber(prefilledUsername) &&
    !forcePasswordMode;

  // Function to check user existence and send OTP
  const sendOtp = useCallback(
    async (mobile: string) => {
      const now = Date.now();

      // Prevent duplicate calls with debounce (1000ms) and initialization check
      if (isSendingOtp || hasCheckedUser || now - lastCallTime < 1000) {
        console.log(
          "sendOtp already in progress, user already checked, or called too recently"
        );
        return;
      }

      console.log("Starting sendOtp for mobile:", mobile);
      setLastCallTime(now);
      setIsSendingOtp(true);
      setHasCheckedUser(true);
      try {
        // Process the mobile number to handle country code
        const processedMobile = processMobileNumber(mobile);
        console.log(
          "Original mobile:",
          mobile,
          "Processed mobile:",
          processedMobile
        );

        // First check if user exists with the specific tenant ID
        const userCheckResponse = await checkUserExistenceWithTenant(
          processedMobile
        );
        console.log("User check response:", userCheckResponse);

        // Check if API returned an error (like 404 - User does not exist)
        if (
          userCheckResponse?.params?.status === "failed" ||
          userCheckResponse?.responseCode === 404 ||
          userCheckResponse?.responseCode !== 200
        ) {
          console.log("User does not exist");
          // Show error message and call the redirect handler
          if (onRedirectToLogin) {
            setTimeout(() => {
              onRedirectToLogin();
            }, 100);
          }
          return;
        }

        // Check if user exists and has the specific tenant ID
        const users = userCheckResponse?.result?.getUserDetails || [];
        const targetTenantId = process.env.NEXT_PUBLIC_TARGET_TENANT_ID;

        if (!users || users.length === 0) {
          console.log("No users found for this mobile number");
          // Show error message for no users found
          if (onRedirectToLogin) {
            setTimeout(() => {
              onRedirectToLogin();
            }, 100);
          }
          return;
        }

        // Find user with target tenant or any user if no specific tenant required
        const userWithTargetTenant =
          users.find(
            (user: { tenantId: string }) => user.tenantId === targetTenantId
          ) || users[0]; // Fallback to first user if no specific tenant match

        if (userWithTargetTenant) {
          console.log("User found, sending OTP:", userWithTargetTenant);
          // User exists, send OTP for login
          const response = await sendOTP({
            mobile: processedMobile,
            reason: "login",
          });

          console.log("OTP sent successfully:", response);
          // Store the hash for OTP verification
          if (response?.result?.data?.hash) {
            setOtpHash(response.result.data.hash);
            console.log("OTP hash stored:", response.result.data.hash);
          }
          setOtpSent(true);
        } else {
          // User doesn't exist or doesn't have target tenant, show error
          console.log("User not found, showing error message");
          if (onRedirectToLogin) {
            setTimeout(() => {
              onRedirectToLogin();
            }, 100);
          }
        }
      } catch (error: unknown) {
        console.error("Error in OTP flow:", error);

        // Check if it's a user not found error (404)
        const errorResponse = error as {
          response?: {
            status?: number;
            data?: {
              responseCode?: number;
              params?: { status?: string; errmsg?: string };
            };
          };
        };
        if (
          errorResponse?.response?.status === 404 ||
          errorResponse?.response?.data?.responseCode === 404 ||
          errorResponse?.response?.data?.params?.status === "failed" ||
          errorResponse?.response?.data?.params?.errmsg ===
            "User does not exist"
        ) {
          console.log("User does not exist - showing error message");
          // Show error message and call the redirect handler
          if (onRedirectToLogin) {
            // Add a small delay to ensure the error message is properly displayed
            setTimeout(() => {
              onRedirectToLogin();
            }, 100);
          }
          return;
        }

        // For any other unexpected errors, switch to password mode
        setForcePasswordMode(true);
      } finally {
        setIsSendingOtp(false);
      }
    },
    [isSendingOtp, hasCheckedUser, lastCallTime, onRedirectToLogin]
  );

  // Set prefilled username if provided and send OTP if it's a mobile number
  useEffect(() => {
    if (prefilledUsername && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setFormData((prev) => ({
        ...prev,
        username: prefilledUsername,
      }));

      // Only send OTP if user is not already authenticated
      const existingToken =
        localStorage.getItem("token") || getCookieValue("token");
    

      if (!existingToken && isMobileNumber(prefilledUsername)) {
        sendOtp(prefilledUsername);
      } else {
        console.log(
          "🚫 LoginComponent: Not sending OTP - user already authenticated or not mobile number"
        );
      }
    }
  }, [prefilledUsername, sendOtp]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (isOtpMode && onVerifyOtp) {
      // OTP mode - verify OTP first
      try {
        console.log("Verifying OTP:", formData.otp, "with hash:", otpHash);

        const verifyResponse = await verifyOTP({
          mobile: formData.username,
          reason: "login",
          otp: formData.otp,
          hash: otpHash,
        });

        console.log("OTP verification response:", verifyResponse);

        if (
          verifyResponse?.responseCode === 200 ||
          verifyResponse?.params?.status === "successful"
        ) {
          // OTP verified successfully, proceed with login
          onVerifyOtp({
            username: formData.username,
            otp: formData.otp,
            remember: formData.remember,
            hash: otpHash,
          });
        } else {
          // OTP verification failed
          console.error("OTP verification failed:", verifyResponse);
          // You can add error handling here if needed
        }
      } catch (error) {
        console.error("Error verifying OTP:", error);
        // You can add error handling here if needed
      }
    } else if (onLogin) {
      // Password mode
      onLogin({
        username: formData.username,
        password: formData.password,
        remember: formData.remember,
      });
    }
  };

  const handleResendOtp = () => {
    if (formData.username && isMobileNumber(formData.username)) {
      setHasCheckedUser(false); // Reset the flag to allow resend
      setOtpHash(""); // Reset the hash
      setOtpSent(false); // Reset OTP sent status
      sendOtp(formData.username);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        maxWidth: 400,
        p: 3,
        borderRadius: 2,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 400,
            fontSize: "24px",
            lineHeight: "32px",
            letterSpacing: "0px",
            textAlign: "center",
            mb: 3,
          }}
        >
          {isOtpMode
            ? t("LEARNER_APP.LOGIN.login_title") || "Verify OTP"
            : t("LEARNER_APP.LOGIN.login_title")}
        </Typography>

        <TextField
          label={t("LEARNER_APP.LOGIN.username_label")}
          name="username"
          value={formData.username}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          margin="normal"
          disabled={Boolean(isOtpMode)} // Disable username field in OTP mode since it's prefilled
        />

        {isOtpMode ? (
          // OTP Mode
          <Box>
            <TextField
              label={t("LEARNER_APP.LOGIN.otp_label") || "Enter OTP"}
              name="otp"
              type="text"
              value={formData.otp}
              onChange={handleChange}
              variant="outlined"
              fullWidth
              margin="normal"
              placeholder="Enter 6-digit OTP"
              inputProps={{
                maxLength: 6,
                pattern: "[0-9]*",
              }}
            />

            {/* OTP Status and Resend */}
            <Box
              mt={1}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              {isSendingOtp ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="textSecondary">
                    Sending OTP...
                  </Typography>
                </Box>
              ) : otpSent ? (
                <Typography variant="body2" color="success.main">
                  OTP sent successfully!
                </Typography>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  OTP will be sent automatically
                </Typography>
              )}

              {otpSent && (
                <Button
                  variant="text"
                  size="small"
                  onClick={handleResendOtp}
                  disabled={isSendingOtp}
                >
                  Resend OTP
                </Button>
              )}
            </Box>
          </Box>
        ) : (
          // Password Mode
          <TextField
            label={t("LEARNER_APP.LOGIN.password_label")}
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            margin="normal"
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}

        <Box mt={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.remember}
                onChange={handleChange}
                name="remember"
              />
            }
            label={t("LEARNER_APP.LOGIN.remember_me")}
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={Boolean(isOtpMode && !otpSent)}
          sx={{
            mt: 3,
            backgroundColor: "#FFC107",
            color: "#000",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#ffb300",
            },
          }}
        >
          {isOtpMode
            ? t("LEARNER_APP.LOGIN.verify_otp_button") || "Verify OTP"
            : t("LEARNER_APP.LOGIN.login_button")}
        </Button>
      </form>
    </Paper>
  );
};

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
  const [prefilledUsername, setPrefilledUsername] = useState<string>("");
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const handleAddAccount = () => {
    router.push("/");
  };

  const { t } = useTranslation();

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

      // If getUserId returns null (due to 401 redirect), exit early
      if (!userResponse) {
        return;
      }

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
          if (tenantId) {
            await ensureAcademicYearForTenant(tenantId);
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

          // Check for redirect path stored by AuthGuard
          const redirectAfterLogin = sessionStorage.getItem("redirectAfterLogin");
          if (redirectAfterLogin && redirectAfterLogin.startsWith("/")) {
            sessionStorage.removeItem("redirectAfterLogin");
            window.location.href = `${window.location.origin}${redirectAfterLogin}`;
          } else {
            // Redirect to learner dashboard with tab=1
            window.location.href = `${window.location.origin}/dashboard?tab=1`;
          }
          return;
        }

        // Handle Creator, Reviewer, Admin roles - redirect to admin portal with SSO
        else if (
          userRole === "Creator" ||
          userRole === "Reviewer" ||
          userRole === "Admin"
        ) {
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
            timestamp: Date.now(),
          };

          // Store SSO data in localStorage for cross-domain access
          localStorage.setItem("ssoData", JSON.stringify(ssoData));

          // Set cookie for admin portal
          document.cookie = `sso_token=${token}; path=/; secure; SameSite=Lax`;
          document.cookie = `user_data=${JSON.stringify(
            ssoData
          )}; path=/; secure; SameSite=Lax`;

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
            label: "Admin Login Button Clicked",
          });

          // Redirect to admin portal with SSO
          window.location.href = `${window.location.origin.replace(
            "3003",
            "3002"
          )}/login`;
          return;
        }

        // Handle unknown roles
        else {
          showToastMessage(
            "User role not recognized. Please contact administrator.",
            "error"
          );
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

  useEffect(() => {
    const init = async () => {
      try {

        preserveLocalStorage();

        // Check for existing authentication first - check both localStorage and cookies
        const localStorageToken = localStorage.getItem("token");
        const cookieToken = getCookieValue("token");
        const access_token = localStorageToken || cookieToken;
        const refresh_token = localStorage.getItem("refreshToken");


        if (access_token) {

          // Check if we have all required authentication data
          const userId = localStorage.getItem("userId");
          const tenantId = localStorage.getItem("tenantId");
          
          // If we have all required data, redirect directly
          if (userId && tenantId) {
            
            // Check for redirect URL in query parameters
            if (typeof window !== "undefined") {
              const searchParams = new URLSearchParams(window.location.search);
              const redirectUrl = searchParams.get("redirectUrl");
              const activeLink = searchParams.get("activeLink");


              if (redirectUrl && redirectUrl.startsWith("/")) {
                // Direct redirect to the target URL without going through login flow
                window.location.href = `${window.location.origin}${redirectUrl}${
                  activeLink ? `?activeLink=${activeLink}` : ""
                }`;
                return;
              }
            }

            // If no redirect URL, redirect to dashboard
            window.location.href = `${window.location.origin}/dashboard?tab=1`;
            return;
          } else {
            // If we have a token but missing userId/tenantId, proceed with full login flow
            const response = {
              result: {
                access_token,
                refresh_token: refresh_token || undefined,
              },
            };
            handleSuccessfulLogin(response?.result, { remember: false }, router);
            return;
          }
        }


        // Only proceed with login form if user is not authenticated
        // Get prefilled username from URL parameters
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search);
          const prefilledUser = searchParams.get("prefilledUsername");
          if (prefilledUser) {
            setPrefilledUsername(prefilledUser);
          }
        }

        if (!localStorage.getItem("did")) {
          const visitorId = await getDeviceId();
          localStorage.setItem(
            "did",
            typeof visitorId === "string" ? visitorId : ""
          );
          console.log("Device fingerprint generated successfully");
        }

        // Show login form only if user is not authenticated
        console.log("📝 Setting showLoginForm to true");
        setShowLoginForm(true);
      } catch (error) {
        console.error("❌ Error in authentication check:", error);
        setShowLoginForm(true);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    init();
  }, [router]);

  const handleForgotPassword = () => {
    localStorage.setItem("redirectionRoute", "/login");
    router.push("/password-forget");
  };

  const handleLogin = async (data: {
    username: string;
    password: string;
    remember: boolean;
  }) => {
    const username = data?.username;
    const password = data?.password;

    // Check if there's a redirect URL - if so, skip auth API and use basic login
    const query = new URLSearchParams(window.location.search);
    const redirectUrl = query.get("redirectUrl");

    if (redirectUrl) {
      console.log(
        "Redirect URL detected, skipping auth API and using basic login"
      );
      // For redirect scenarios, create a basic token and proceed
      const basicToken = "basic_token_" + Date.now();
      localStorage.setItem("token", basicToken);

      const response = {
        result: {
          access_token: basicToken,
          user: {
            username: username,
          },
        },
      };

      handleSuccessfulLogin(response?.result, data, router);
      return;
    }

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
    } catch {
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
    hash: string;
  }) => {
    const username = data?.username;
    const otp = data?.otp;
    const hash = data?.hash;

    try {
      console.log(
        "OTP verification successful, proceeding with login for username:",
        username
      );

      // OTP has already been verified in LoginComponent
      // Now we need to get the actual tokens from the verifyOTP response
      // The verifyOTP response should contain access_token and refresh_token
      const verifyResponse = await verifyOTP({
        mobile: username,
        reason: "login",
        otp: otp,
        hash: hash,
      });

      console.log("OTP verification response:", verifyResponse);

      // Extract tokens from the verifyOTP response
      const access_token =
        verifyResponse?.result?.token || verifyResponse?.result?.access_token;
      const refresh_token = verifyResponse?.result?.refresh_token;

      if (access_token) {
        // Store tokens in localStorage
        localStorage.setItem("token", access_token);
        if (refresh_token) {
          localStorage.setItem("refreshToken", refresh_token);
        }

        // Create response object for handleSuccessfulLogin
        const response = {
          result: {
            access_token: access_token,
            refresh_token: refresh_token,
            user: {
              username: username,
            },
          },
        };

        // Check for redirect URL before calling handleSuccessfulLogin
        const query = new URLSearchParams(window.location.search);
        const redirectUrl = query.get("redirectUrl");


        if (redirectUrl && redirectUrl.startsWith("/")) {
          // For redirect URLs, call auth API and then redirect directly
          await handleSuccessfulLogin(response?.result, data, router);
        } else {
          // For normal login, use the standard flow
          handleSuccessfulLogin(response?.result, data, router);
        }
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

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
       
        sx={{
          background: "linear-gradient(135deg, #FFFDF6, #F8EFDA)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Don't render login form if user is already authenticated
  if (!showLoginForm) {
    return null;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Box
        display="flex"
        flexDirection="column"
        sx={{
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

            {showLoginForm && (
              <LoginComponent
                onLogin={handleLogin}
                onVerifyOtp={handleVerifyOtp}
                handleForgotPassword={handleForgotPassword}
                handleAddAccount={handleAddAccount}
                prefilledUsername={prefilledUsername}
                onRedirectToLogin={() => {
                  // Show error message for unregistered user
                  showToastMessage(
                    "User not registered. Please contact your administrator to register your account.",
                    "error"
                  );
                  console.log("User not registered - showing error message");
                }}
              />
            )}

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