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
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Image from "next/image";
import Header from "@learner/components/Header/Header";
import { getUserId, login } from "@learner/utils/API/LoginService";
import { checkUserExistenceWithTenant } from "@learner/utils/API/userService";
import { sendOTP, verifyOTP } from "@learner/utils/API/OtPService";
import { showToastMessage } from "@learner/components/ToastComponent/Toastify";
import { useRouter } from "next/navigation";
import { useTranslation } from "@shared-lib";
import { getAcademicYear } from "@learner/utils/API/AcademicYearService";
import { preserveLocalStorage } from "@learner/utils/helper";
import { getDeviceId } from "@shared-lib-v2/DynamicForm/utils/Helper";
import { profileComplitionCheck } from "@learner/utils/API/userService";
import { telemetryFactory } from "@shared-lib-v2/DynamicForm/utils/telemetry";
import { logEvent } from "@learner/utils/googleAnalytics";

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
  const router = useRouter();

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [forcePasswordMode, setForcePasswordMode] = useState(false); // Default to OTP mode
  const [hasCheckedUser, setHasCheckedUser] = useState(false);
  const [lastCallTime, setLastCallTime] = useState(0);
  const [otpHash, setOtpHash] = useState<string>("");
  const hasInitializedRef = useRef(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
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
  const isOtpMode = otpSent && !forcePasswordMode;

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
        // Handle both cases: error in response body or error response code
        const isErrorResponse = 
          userCheckResponse?.params?.status === "failed" ||
          userCheckResponse?.responseCode === 404 ||
          (userCheckResponse?.responseCode !== 200 && userCheckResponse?.responseCode !== undefined && userCheckResponse?.responseCode !== null);
        
        if (isErrorResponse) {
          console.log("API returned error response:", userCheckResponse);
          // Check if it's specifically "User does not exist" error
          const isUserNotFoundError = 
            userCheckResponse?.params?.errmsg === "User does not exist" ||
            userCheckResponse?.params?.err === "Not Found" ||
            userCheckResponse?.responseCode === 404 ||
            (userCheckResponse?.params?.status === "failed" && userCheckResponse?.responseCode === 404);
          
          if (isUserNotFoundError) {
            // Show specific error message for user not found
            showToastMessage(
              "User does not exist. Please contact admin.",
              "error"
            );
          } else {
            // Show generic error message
            showToastMessage(
              "An error occurred. Please try again.",
              "error"
            );
          }
          // Reset hasCheckedUser to allow user to try again with different number
          setHasCheckedUser(false);
          return;
        }

        // Check if user exists and has the specific tenant ID
        const users = userCheckResponse?.result?.getUserDetails || [];
        const targetTenantId = process.env.NEXT_PUBLIC_TARGET_TENANT_ID;

        if (!users || users.length === 0) {
          console.log("No users found for this mobile number");
          // Show error message for no users found
          showToastMessage(
            "User does not exist. Please contact admin.",
            "error"
          );
          // Reset hasCheckedUser to allow user to try again with different number
          setHasCheckedUser(false);
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
          // Start 120 second timer when first entering OTP step
          setResendTimer(120);
          // Trigger OTP mode by setting prefilledUsername
          setFormData((prev) => ({
            ...prev,
            username: processedMobile,
          }));
        } else {
          // User doesn't exist or doesn't have target tenant, show error
          console.log("User not found, showing error message");
          showToastMessage(
            "User does not exist. Please contact admin.",
            "error"
          );
          // Reset hasCheckedUser to allow user to try again with different number
          setHasCheckedUser(false);
        }
      } catch (error: unknown) {
        console.error("Error in OTP flow:", error);

        // Check if it's a user not found error (404)
        // Handle axios error structure: error.response.data contains the API response
        const errorResponse = error as {
          response?: {
            status?: number;
            data?: {
              responseCode?: number;
              params?: { status?: string; errmsg?: string; err?: string };
            };
          };
        };
        
        // Extract error data from axios error response
        const errorData = errorResponse?.response?.data;
        
        // Check for user not found error in various formats
        const isUserNotFoundError = 
          errorResponse?.response?.status === 404 ||
          errorData?.responseCode === 404 ||
          errorData?.params?.status === "failed" ||
          errorData?.params?.errmsg === "User does not exist" ||
          errorData?.params?.err === "Not Found" ||
          (errorData?.params?.status === "failed" && errorData?.responseCode === 404);
        
        if (isUserNotFoundError) {
          console.log("User does not exist - showing error message");
          // Show specific error message for user not found
          showToastMessage(
            "User does not exist. Please contact admin.",
            "error"
          );
          // Reset hasCheckedUser to allow user to try again with different number
          setHasCheckedUser(false);
          return;
        }

        // For any other unexpected errors, switch to password mode
        setForcePasswordMode(true);
      } finally {
        setIsSendingOtp(false);
      }
    },
    [isSendingOtp, hasCheckedUser, lastCallTime]
  );

  // Timer countdown effect for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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

  const handleResendOtp = async () => {
    // Check if resend attempts limit reached
    if (resendAttempts >= 2) {
      showToastMessage(
        "Maximum resend attempts reached. Please try again later.",
        "error"
      );
      return;
    }

    // Check if timer is still active
    if (resendTimer > 0) {
      return;
    }

    if (formData.username && isMobileNumber(formData.username)) {
      setResendTimer(120); // Start 120 second timer
      setResendAttempts((prev) => prev + 1); // Increment attempt count
      
      // Reset the flag to allow resend but keep OTP mode active
      setHasCheckedUser(false);
      
      // Call sendOtp directly without resetting otpSent
      const processedMobile = processMobileNumber(formData.username);
      setIsSendingOtp(true);
      
      try {
        const response = await sendOTP({
          mobile: processedMobile,
          reason: "login",
        });

        console.log("OTP resent successfully:", response);
        // Store the new hash for OTP verification
        if (response?.result?.data?.hash) {
          setOtpHash(response.result.data.hash);
          console.log("New OTP hash stored:", response.result.data.hash);
        }
        // Clear the OTP input so user can enter new OTP
        setFormData((prev) => ({
          ...prev,
          otp: "",
        }));
        showToastMessage("OTP resent successfully", "success");
      } catch (error) {
        console.error("Error resending OTP:", error);
        showToastMessage("Failed to resend OTP. Please try again.", "error");
        // Decrement attempt count on error so user can retry
        setResendAttempts((prev) => Math.max(0, prev - 1));
      } finally {
        setIsSendingOtp(false);
        setHasCheckedUser(true);
      }
    }
  };

  // OTP input refs for individual boxes
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    // Filter out non-numeric characters
    const numericValue = value.replace(/\D/g, "");
    
    if (numericValue.length > 1) {
      // If pasting, handle all digits
      const digits = numericValue.slice(0, 6).split("");
      const newOtp = [...formData.otp.split("")];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setFormData((prev) => ({
        ...prev,
        otp: newOtp.join("").slice(0, 6),
      }));
      // Focus on the last filled box or next empty box
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
    } else {
      // Single digit input - only allow if it's a number
      if (numericValue || value === "") {
        const newOtp = formData.otp.split("");
        newOtp[index] = numericValue;
        setFormData((prev) => ({
          ...prev,
          otp: newOtp.join("").slice(0, 6),
        }));
        // Move to next box if value entered
        if (numericValue && index < 5) {
          otpRefs.current[index + 1]?.focus();
        }
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    // Filter out non-numeric characters
    const numericValue = pastedData.replace(/\D/g, "");
    
    if (numericValue.length > 0) {
      // Take only first 6 digits
      const digits = numericValue.slice(0, 6).split("");
      const newOtp = new Array(6).fill("");
      
      // Fill the OTP array with pasted digits
      digits.forEach((digit, i) => {
        if (i < 6) {
          newOtp[i] = digit;
        }
      });
      
      setFormData((prev) => ({
        ...prev,
        otp: newOtp.join(""),
      }));
      
      // Focus on the last filled box or the last box if all 6 digits are pasted
      const nextIndex = Math.min(digits.length - 1, 5);
      if (nextIndex >= 0) {
        setTimeout(() => {
          otpRefs.current[nextIndex]?.focus();
        }, 0);
      }
    }
  };

  const handleSendOtp = async () => {
    if (formData.username && isMobileNumber(formData.username)) {
      await sendOtp(formData.username);
    }
  };

  const handleBack = () => {
    if (isOtpMode) {
      // Go back to phone number step
      setOtpSent(false);
      setHasCheckedUser(false);
      setOtpHash("");
      setResendTimer(0);
      setResendAttempts(0); // Reset resend attempts when going back
      setFormData((prev) => ({
        ...prev,
        otp: "",
      }));
    } else {
      // Go back to home page
      router.push("/");
    }
  };

  return (
    <Box
      sx={{
        maxWidth: { xs: "100%", sm: 500 },
        width: "100%",
        px: { xs: 1, sm: 0 },
      }}
    >
      {/* Back Button */}
      <IconButton
        onClick={handleBack}
        sx={{
          mb: { xs: 1, sm: 2 },
          color: "#1F1B13",
          "&:hover": {
            backgroundColor: "#F5F5F5",
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      {/* Login Title - H1: 24-28px */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: "24px", sm: "26px", md: "28px" },
          lineHeight: { xs: "32px", sm: "36px", md: "40px" },
          color: "#1A1A1A",
          mb: { xs: 1.5, sm: 2 },
        }}
      >
        {t("LEARNER_APP.LOGIN.login_title") || "Login"}
      </Typography>

      {!isOtpMode ? (
        // Phone Number Step
        <>
          {/* Instruction Text */}
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: "14px", sm: "15px", md: "16px" },
              lineHeight: { xs: "20px", sm: "22px", md: "24px" },
              color: "#1A1A1A",
              mb: { xs: 3, sm: 4 },
            }}
          >
            👋 {t("LEARNER_APP.LOGIN.PHONE_INSTRUCTION") || "Hi there! Log in with your registered phone number to continue."}
          </Typography>

          {/* Phone Number Input */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: { xs: "13px", sm: "14px" },
                color: "#1A1A1A",
                mb: 1,
              }}
            >
              {t("LEARNER_APP.LOGIN.PHONE_NUMBER") || "Phone Number"}
            </Typography>
            <TextField
              name="username"
              value={formData.username}
              onChange={(e) => {
                // Only allow numbers and limit to 10 digits
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setFormData((prev) => ({
                  ...prev,
                  username: value,
                }));
                // Reset hasCheckedUser when user changes the phone number
                // This allows them to try again with a different number
                if (hasCheckedUser) {
                  setHasCheckedUser(false);
                }
              }}
              placeholder="+91 0000000000"
              fullWidth
              inputProps={{
                maxLength: 10,
                pattern: "[0-9]*",
                inputMode: "numeric",
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "4px",
                  backgroundColor: "#F5F5F5",
                  "& fieldset": {
                    borderColor: "#E0E0E0",
                  },
                  "&:hover fieldset": {
                    borderColor: "#E0E0E0",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#E6873C",
                  },
                },
              }}
            />
          </Box>

          {/* Send OTP Button */}
          <Button
            onClick={handleSendOtp}
            disabled={!formData.username || isSendingOtp}
            fullWidth
            sx={{
              py: { xs: 1.25, sm: 1.5 },
              backgroundColor: "#E6873C",
              color: "#FFFFFF",
              fontSize: { xs: "14px", sm: "16px" },
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              mb: { xs: 4, sm: 6 },
              "&:hover": {
                backgroundColor: "#D6772C", // Slightly darker orange for hover
              },
              "&:focus": {
                backgroundColor: "#D6772C",
                boxShadow: "0 0 0 3px rgba(230, 135, 60, 0.2)", // 20% opacity overlay for focus
              },
              "&:disabled": {
                backgroundColor: "#F5F5F5",
                color: "#1A1A1A",
                opacity: 0.5,
              },
            }}
          >
            {isSendingOtp ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} sx={{ color: "#FFFFFF" }} />
                <span>{t("LEARNER_APP.LOGIN.SENDING") || "Sending..."}</span>
              </Box>
            ) : (
              t("LEARNER_APP.LOGIN.SEND_OTP") || "SEND OTP"
            )}
          </Button>

          {/* Pagination Dots - Step 2 (First and second dots active) */}
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
          </Box>
        </>
      ) : (
        // OTP Verification Step
        <>
          {/* Instruction Text */}
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: "14px", sm: "15px", md: "16px" },
              lineHeight: { xs: "20px", sm: "22px", md: "24px" },
              color: "#1A1A1A",
              mb: { xs: 3, sm: 4 },
            }}
          >
            {t("LEARNER_APP.LOGIN.OTP_INSTRUCTION") || "Enter the 6-digit OTP sent to your phone."}
          </Typography>

          {/* OTP Label */}
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: "14px",
              color: "#1F1B13",
              mb: 2,
            }}
          >
            {t("LEARNER_APP.LOGIN.otp_label") || "OTP"}
          </Typography>

          {/* 6 Individual OTP Input Boxes */}
          <Box
            sx={{
              display: "flex",
              gap: { xs: 1, sm: 1.5 },
              mb: { xs: 3, sm: 4 },
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TextField
                key={index}
                inputRef={(el) => {
                  otpRefs.current[index] = el;
                }}
                value={formData.otp[index] || ""}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                inputProps={{
                  maxLength: 1,
                  pattern: "[0-9]*",
                  inputMode: "numeric",
                  style: {
                    textAlign: "center",
                    fontSize: "24px",
                    fontWeight: 600,
                  },
                }}
                onInput={(e) => {
                  // Additional validation to prevent non-numeric input
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.replace(/\D/g, "");
                }}
                sx={{
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 },
                  "& .MuiOutlinedInput-root": {
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 },
                    borderRadius: "4px",
                    "& input": {
                      fontSize: { xs: "20px", sm: "24px" },
                    },
                    "& fieldset": {
                      borderColor: "#E0E0E0",
                    },
                    "&:hover fieldset": {
                      borderColor: "#E6873C",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#E6873C",
                    },
                  },
                }}
              />
            ))}
          </Box>

          {/* Send Button */}
          <Button
            onClick={handleSubmit}
            disabled={formData.otp.length !== 6}
            fullWidth
            sx={{
              py: { xs: 1.25, sm: 1.5 },
              backgroundColor: "#E6873C",
              color: "#FFFFFF",
              fontSize: { xs: "14px", sm: "16px" },
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              mb: { xs: 1.5, sm: 2 },
              "&:hover": {
                backgroundColor: "#D6772C", // Slightly darker orange for hover
              },
              "&:focus": {
                backgroundColor: "#D6772C",
                boxShadow: "0 0 0 3px rgba(230, 135, 60, 0.2)", // 20% opacity overlay for focus
              },
              "&:disabled": {
                backgroundColor: "#F5F5F5",
                color: "#1A1A1A",
                opacity: 0.5,
              },
            }}
          >
            {t("LEARNER_APP.LOGIN.ENTER_OTP") || "ENTER OTP"}
          </Button>

          {/* Resend OTP Button */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: { xs: 4, sm: 6 },
            }}
          >
            <Button
              onClick={handleResendOtp}
              disabled={resendTimer > 0 || resendAttempts >= 2}
              sx={{
                textTransform: "none",
                color: resendAttempts >= 2 ? "#999999" : "#E6873C",
                fontSize: { xs: "13px", sm: "14px" },
                fontWeight: 400,
                minWidth: "auto",
                padding: 0,
                "&:hover": {
                  backgroundColor: "transparent",
                  textDecoration: "underline",
                },
                "&:disabled": {
                  color: "#999999",
                },
              }}
            >
              {resendAttempts >= 2
                ? t("LEARNER_APP.LOGIN.RESEND_OTP_DISABLED") || "Resend OTP (Limit Reached)"
                : resendTimer > 0
                ? `${t("LEARNER_APP.LOGIN.RESEND_OTP") || "Resend OTP"} (${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, "0")})`
                : t("LEARNER_APP.LOGIN.RESEND_OTP") || "Resend OTP"}
            </Button>
          </Box>

          {/* Pagination Dots - Step 3 */}
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
                backgroundColor: "#E6873C",
              }}
            />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#E6873C",
              }}
            />
          </Box>
        </>
      )}
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

          // Check for redirect path stored by AuthGuard
          const redirectAfterLogin = sessionStorage.getItem("redirectAfterLogin");
          if (redirectAfterLogin && redirectAfterLogin.startsWith("/")) {
            sessionStorage.removeItem("redirectAfterLogin");
            window.location.href = `${window.location.origin}${redirectAfterLogin}`;
          } else {
            // Redirect to learner dashboard with tab=1
            window.location.href = `${window.location.origin}/dashboard?tab=0`;
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
            window.location.href = `${window.location.origin}/dashboard?tab=0`;
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
          // background: "linear-gradient(135deg, #FFFDF6, #F8EFDA)",
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
          backgroundColor: "#FFFFFF",
          minHeight: "100vh",
        }}
      >
        {/* Fixed Header */}
        <Header />

        {/* Main Content: Two Column Layout */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            pt: { xs: 9, sm: 11 },
            minHeight: "calc(100vh - 80px)",
          }}
        >
          {/* Left Column - Login Form */}
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
  );
};

export default LoginPage;