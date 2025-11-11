"use client";

import React, { useEffect, useState } from "react";
import { Alert, Box, Typography, Container, Grid, Button, Skeleton, Paper, Chip, Avatar, Divider, IconButton } from "@mui/material";
import Layout from "../../components/Layout";
import UserProfileCard from "@learner/components/UserProfileCard/UserProfileCard";
import CourseCertificateCard from "@learner/components/CourseCertificateCard/CourseCertificateCard";
import { courseWiseLernerList } from "@shared-lib-v2/utils/CertificateService/coursesCertificates";
import { CertificateModal, get, useTranslation } from "@shared-lib";
import { useRouter } from "next/navigation";
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import InfoIcon from "@mui/icons-material/Info";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SchoolIcon from "@mui/icons-material/School";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountCircle from "@mui/icons-material/AccountCircle";

import { baseurl } from "@learner/utils/API/EndUrls";
import { Info } from "@mui/icons-material";
import { showToastMessage } from "@learner/components/ToastComponent/Toastify";
import { transformImageUrl } from "@learner/utils/imageUtils";
import Image from "next/image";
import ProfileMenu from "../../components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";

type FilterDetails = {
  status?: string[];
  tenantId?: string;
  userId?: string;
};
const ProfilePage = () => {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const [filters] = useState<FilterDetails>({
    status: ["completed", "viewCertificate"],
    tenantId:
      (typeof window !== "undefined" && localStorage.getItem("tenantId")) || "",
    userId:
      (typeof window !== "undefined" && localStorage.getItem("userId")) || "",
  });
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateId, setCertificateId] = useState("");
  const [courseData, setCourseData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  
  // Cache key for storing certificate data
  const cacheKey = `profile-certificates-${filters.userId}-${filters.tenantId}`;

  const handlePreview = async (id: string) => {
    try {
      if (!id || id === "null" || id === "undefined" || id.trim() === "") {
        showToastMessage("Certification Id not found", "error");
        return;
      }
      console.log("Opening certificate with ID:", id);
      setCertificateId(id);
      setShowCertificate(true);
    } catch (error) {
      console.error("Error opening certificate:", error);
      showToastMessage("Error opening certificate", "error");
    }
  };

  useEffect(() => {
    const prepareCertificateData = async () => {
      try {
        setLoading(true);
        
        // Check if data is cached and still valid (cache for 5 minutes)
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTimestamp = localStorage.getItem(`${cacheKey}-timestamp`);
        const now = Date.now();
        const cacheExpiry = 5 * 60 * 1000; // 5 minutes
        
        if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheExpiry) {
          console.log("Using cached certificate data");
          setCourseData(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
        
        const finalArray = [];

        const response = await courseWiseLernerList({ filters });
        console.log("response", response.data);
        console.log("Raw certificate data from API:", response.data);
        
        // Check for certificates with missing certificate IDs
        const certificatesWithMissingIds = response.data.filter((item: any) => 
          !item.certificateId || 
          item.certificateId === "null" || 
          item.certificateId === "undefined" || 
          item.certificateId.trim() === ""
        );
        
        if (certificatesWithMissingIds.length > 0) {
          console.warn("Found certificates with missing certificate IDs:", certificatesWithMissingIds);
        }

        // Process certificates in parallel instead of sequential
        const courseDetailsPromises = response.data.map(async (item: any) => {
          try {
            console.log(`Fetching details for courseId: ${item.courseId}`);
            const Details: any = await get(
              `${baseurl}/action/content/v3/read/${item.courseId}`,
              {
                tenantId: localStorage.getItem("tenantId") || "",
                Authorization: `Bearer ${
                  localStorage.getItem("accToken") || ""
                }`,
              }
            );
            console.log("courseDetails", Details);

            if (
              !Details.data ||
              !Details.data.result ||
              !Details.data.result.content
            ) {
              console.error("Invalid course details response:", Details);
              throw new Error("Invalid course details response");
            }

            let courseDetails = Details.data.result.content;
            console.log("Extracted course details:", {
              name: courseDetails.name,
              title: courseDetails.title,
              program: courseDetails.program,
              description: courseDetails.description,
              posterImage: courseDetails.posterImage,
            });

            // Try different possible field names for the course title
            const courseTitle =
              courseDetails.name ||
              courseDetails.title ||
              courseDetails.program ||
              `Course ${item.courseId.slice(-8)}`;

            const obj = {
              usercertificateId: item.usercertificateId,
              userId: item.userId,
              courseId: item.courseId,
              certificateId: item.certificateId,
              completedOn: item.issuedOn,
              description:
                courseDetails.description || "Course completion certificate",
              posterImage: transformImageUrl(courseDetails.posterImage) || "/images/image_ver.png",
              program: courseTitle,
            };
            console.log("Created certificate object:", obj);
            return obj;
          } catch (error) {
            console.error(
              `Failed to fetch course details for courseId: ${item.courseId}`,
              error
            );
            // Create a basic certificate object even if course details fail
            const obj = {
              usercertificateId: item.usercertificateId,
              userId: item.userId,
              courseId: item.courseId,
              certificateId: item.certificateId,
              completedOn: item.issuedOn,
              description: "Course completion certificate",
              posterImage: "/images/image_ver.png",
              program: `Course ${item.courseId.slice(-8)}`,
            };
            console.log("Created fallback certificate object:", obj);
            return obj;
          }
        });

        // Wait for all course details to be fetched in parallel
        const courseDetailsResults = await Promise.all(courseDetailsPromises);
        
        // Filter out certificates with invalid certificate IDs
        const validCertificates = courseDetailsResults.filter(cert => {
          const hasValidId = cert.certificateId && 
                            cert.certificateId !== "null" && 
                            cert.certificateId !== "undefined" && 
                            cert.certificateId.trim() !== "";
          
          if (!hasValidId) {
            console.warn(`Filtering out certificate with invalid ID:`, {
              courseId: cert.courseId,
              certificateId: cert.certificateId,
              program: cert.program
            });
          }
          
          return hasValidId;
        });
        
        finalArray.push(...validCertificates);

        console.log("finalArray (filtered):", finalArray);
        console.log(`Filtered out ${courseDetailsResults.length - validCertificates.length} certificates with invalid IDs`);

        // Add a test certificate if no certificates were found
        if (finalArray.length === 0) {
          console.log("No certificates found, adding test certificate");
          finalArray.push({
            usercertificateId: "test-id",
            userId: "test-user",
            courseId: "test-course",
            certificateId: "did:rcw:test-certificate-id",
            completedOn: new Date().toISOString(),
            description: "Test certificate description",
            posterImage: "/images/image_ver.png",
            program: "Test Course",
          });
        }

        setCourseData(finalArray);
        
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify(finalArray));
        localStorage.setItem(`${cacheKey}-timestamp`, now.toString());
        console.log("Certificate data cached");
        
      } catch (error) {
        console.error("Error fetching certificate data:", error);
        showToastMessage("Error loading certificates", "error");
      } finally {
        setLoading(false);
      }
    };
    prepareCertificateData();
  }, [filters]);

  useEffect(() => {
    if (!checkAuth()) {
      router.push("/login");
    }
  }, [router]);

  const isYouthNet =
    typeof window !== "undefined" &&
    localStorage.getItem("userProgram") === "YouthNet";

  // Show certificates section if user has certificates or is YouthNet
  const shouldShowCertificates = courseData.length > 0 || isYouthNet;

  // Debug logging
  console.log("Profile page state:", {
    courseDataLength: courseData.length,
    isYouthNet,
    shouldShowCertificates,
    courseData: courseData,
  });

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
    <Layout
      onlyHideElements={["footer", "topBar"]}
    >
      {/* Custom Header with Logo and Language */}
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
                fontSize: "14px",
                fontWeight: 400,
                textTransform: "none",
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: language === "en" ? "#E6873C" : "#D0D0D0",
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
                fontSize: "14px",
                fontWeight: 400,
                textTransform: "none",
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: language === "hi" ? "#E6873C" : "#D0D0D0",
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

      {/* Hero Section with Gradient Background */}
      <Box
        sx={{
          background: '#FFFFFF',
          py: 4,
          pt: { xs: 12, sm: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Back Button */}
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/dashboard")}
              sx={{
                color: "#1A1A1A",
                borderColor: "rgba(26,26,26,0.3)",
                backgroundColor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(10px)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.9)",
                  borderColor: "rgba(26,26,26,0.5)",
                },
              }}
            >
              Back to Dashboard
            </Button>
          </Box>

          {/* Profile Header */}
          <Box sx={{ textAlign: 'center', color: '#1A1A1A', mb: 4 }}>
            <Typography
              variant="h2"
              fontWeight={700}
              sx={{ 
                mb: 2, 
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontSize: '24px'
              }}
            >
              My Profile
            </Typography>
            <Typography
              variant="h5"
              sx={{ 
                opacity: 0.8, 
                fontWeight: 400,
                fontSize: '16px'
              }}
            >
              Track your learning journey and achievements
            </Typography>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  color: '#1A1A1A',
                }}
              >
                <SchoolIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5, fontSize: '24px' }}>
                  {courseData.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '14px' }}>
                  Courses Completed
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  color: '#1A1A1A',
                }}
              >
                <EmojiEventsIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5, fontSize: '24px' }}>
                  {courseData.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '14px' }}>
                  Certificates Earned
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* User Profile Card */}
          <Grid item xs={12} md={shouldShowCertificates ? 4 : 12}>
            <UserProfileCard
              maxWidth={shouldShowCertificates ? "100%" : "100%"}
            />
          </Grid>

          {/* Certificates Section */}
          {shouldShowCertificates && (
            <Grid item xs={12} md={8}>
              <Paper
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                {/* Section Header */}
                <Box
                  sx={{
                    background: '#F5F5F5',
                    p: 3,
                    color: '#1A1A1A',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmojiEventsIcon sx={{ fontSize: 32, mr: 2 }} />
                    <Box>
                      <Typography variant="h4" fontWeight={700}>
                        {isYouthNet ? "YouthNet Achievements" : "My Certificates"}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        Your completed courses and earned certificates
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Chip
                    label={`${courseData.length} Certificate${courseData.length !== 1 ? 's' : ''}`}
                    sx={{
                      backgroundColor: 'rgba(26,26,26,0.1)',
                      color: '#1A1A1A',
                      fontWeight: 600,
                    }}
                  />
                </Box>

                {/* Content */}
                <Box sx={{ p: 3 }}>
                  {loading ? (
                    <Grid container spacing={3}>
                      {[1, 2, 3, 4].map((index) => (
                        <Grid item xs={12} sm={6} lg={4} xl={3} key={index}>
                          <Box sx={{ p: 1 }}>
                            <Skeleton 
                              variant="rectangular" 
                              height={280} 
                              sx={{ borderRadius: 3, mb: 2 }} 
                            />
                            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
                            <Skeleton variant="text" width="60%" height={20} />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : courseData.length === 0 ? (
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      p={6}
                      sx={{
                        backgroundColor: "#fff9f0",
                        borderRadius: 3,
                        border: "2px dashed #fdbd16",
                        textAlign: 'center',
                      }}
                    >
                      <EmojiEventsIcon sx={{ color: "#FDBE16", fontSize: 64, mb: 2 }} />
                      <Typography variant="h5" fontWeight={600} color="#78590C" sx={{ mb: 1 }}>
                        No Certificates Yet
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Complete courses to earn your first certificate and showcase your achievements!
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => router.push("/courses-contents")}
                        sx={{
                          backgroundColor: "#78590C",
                          "&:hover": { backgroundColor: "#B8860B" },
                        }}
                      >
                        Explore Courses
                      </Button>
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      {courseData.map((cert: any, index: number) => {
                        console.log(`Rendering certificate ${index}:`, cert);
                        
                        // Additional validation for certificate ID
                        const hasValidCertificateId = cert.certificateId && 
                          cert.certificateId !== "null" && 
                          cert.certificateId !== "undefined" && 
                          cert.certificateId.trim() !== "";
                        
                        return (
                          <Grid item xs={12} sm={6} lg={4} xl={3} key={index}>
                            <CourseCertificateCard
                              title={cert.program || "Untitled Course"}
                              description={
                                cert.description || "No description available"
                              }
                              imageUrl={
                                cert.posterImage || "/images/image_ver.png"
                              }
                              completionDate={
                                cert.completedOn || new Date().toISOString()
                              }
                              onPreviewCertificate={() => {
                                if (!hasValidCertificateId) {
                                  showToastMessage("Certificate ID not available for this course", "warning");
                                  return;
                                }
                                handlePreview(cert.certificateId);
                              }}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* Certificate Modal */}
      <CertificateModal
        certificateId={certificateId}
        open={showCertificate}
        setOpen={setShowCertificate}
      />

      <ProfileMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onProfileClick={handleProfileClick}
        onLogout={() => handleLogoutClick()}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        modalOpen={logoutModalOpen}
        message="Are you sure you want to logout?"
        handleAction={performLogout}
        buttonNames={{
          primary: "Logout",
          secondary: "Cancel",
        }}
        handleCloseModal={() => setLogoutModalOpen(false)}
      />
    </Layout>
  );
};

export default ProfilePage;
