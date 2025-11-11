/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { debounce } from "lodash";
import Layout from "@learner/components/Layout";
import { Tabs, Tab, Typography, Box, Grid, TextField, InputAdornment, IconButton, Button } from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon, AccountCircle } from "@mui/icons-material";
import { useRouter } from "next/navigation";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import { getTenantInfo } from "@learner/utils/API/ProgramService";
import LearnerCourse from "@learner/components/Content/LearnerCourse";
import GroupsManager from "@learner/components/Content/GroupsManager";
import ProfileMenu from "../../components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import Image from "next/image";
import { useTranslation } from "@shared-lib";

const DashboardPage = () => {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<"content" | "Course" | "groups">("content");
  const [filter, setFilter] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // For menu positioning
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [dynamicFilterFields, setDynamicFilterFields] = useState<{
    onlyFields: string[];
    isOpenColapsed: string[];
  }>({
    onlyFields: [],
    isOpenColapsed: [],
  });
  const hasInitialized = useRef(false);
  
  // Immediate authentication check and redirect
  React.useLayoutEffect(() => {
    if (typeof window !== "undefined" && !checkAuth()) {
      const currentPath = window.location.pathname + window.location.search;
      if (
        currentPath !== "/login" &&
        currentPath !== "/login-simple" &&
        !currentPath.startsWith("/login")
      ) {
        sessionStorage.setItem("redirectAfterLogin", currentPath);
      }
      window.location.replace("/login");
    }
  }, []);
  
  // Don't render content if not authenticated
  if (typeof window !== "undefined" && !checkAuth()) {
    return null;
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize activeTab from URL parameter
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get("tab");
      if (tabParam === "0") {
        setActiveTab("Course");
      } else if (tabParam === "1") {
        setActiveTab("content");
      } else if (tabParam === "2") {
        setActiveTab("groups");
      } else {
        setActiveTab("content");
      }
    }
  }, []);

  useEffect(() => {
    // Prevent duplicate API calls in React StrictMode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Don't make any API calls if not authenticated
    if (typeof window !== "undefined" && !checkAuth()) {
      return;
    }

    const fetchTenantInfo = async () => {
      try {
        if (!checkAuth()) {
          return; // Exit early if not authenticated
        }
        const res = await getTenantInfo();
        const youthnetContentFilter = res?.result?.find(
          (program: { name: string }) => program.name === "YouthNet"
        );

        if (typeof window !== "undefined") {
          const storedChannelId = localStorage.getItem("channelId");
          if (!storedChannelId) {
            const channelId = youthnetContentFilter?.channelId;
            if (channelId) {
              localStorage.setItem("channelId", channelId);
            }
          }

          const storedTenantId = localStorage.getItem("tenantId");
          if (!storedTenantId) {
            const tenantId = youthnetContentFilter?.tenantId;
            if (tenantId) {
              localStorage.setItem("tenantId", tenantId);
            }
          }

          const storedCollectionFramework = localStorage.getItem(
            "collectionFramework"
          );
          if (!storedCollectionFramework) {
            const collectionFramework =
              youthnetContentFilter?.collectionFramework;
            if (collectionFramework) {
              localStorage.setItem("collectionFramework", collectionFramework);
            }
          }
        }
        // Fetch framework data for dynamic filters
        let filterFramework = null;
        let staticFilter = null;

        try {
          const storedCollectionFramework = localStorage.getItem(
            "collectionFramework"
          );
          const collectionFramework =
            storedCollectionFramework ||
            youthnetContentFilter?.collectionFramework;
          const storedChannelId = localStorage.getItem("channelId");
          const channelId = storedChannelId || youthnetContentFilter?.channelId;

          if (collectionFramework) {
            const { filterContent, staticFilterContent } = await import(
              "@shared-lib-v2/utils/AuthService"
            );

            const [frameworkData, staticData] = await Promise.all([
              filterContent({ instantId: collectionFramework }),
              channelId
                ? staticFilterContent({ instantFramework: channelId })
                : null,
            ]);

            // Filter out invalid terms with template placeholders
            const cleanedFrameworkData = {
              ...frameworkData,
              framework: {
                ...frameworkData?.framework,
                categories:
                  frameworkData?.framework?.categories?.map((category: { terms?: Array<{ code?: string; name?: string; status?: string }> }) => {
                    const originalTerms = category.terms || [];
                    const filteredTerms = originalTerms.filter((term: { code?: string; name?: string; status?: string }) => {
                      const hasTemplate =
                        term.code?.includes("{{") || term.name?.includes("{{");
                      const isLive = term.status === "Live";
                      const isValid = !hasTemplate && isLive;

                      return isValid;
                    });

                    return {
                      ...category,
                      terms: filteredTerms,
                    };
                  }) || [],
              },
            };

            filterFramework = cleanedFrameworkData;
            staticFilter = staticData;

            // Extract categories and transform to filter field codes
            const { transformRenderForm } = await import(
              "@shared-lib-v2/lib/Filter/FilterForm"
            );
            const categories =
              cleanedFrameworkData?.framework?.categories ?? [];
            const transformedFields = transformRenderForm(categories);

            // Generate onlyFields and isOpenColapsed dynamically from framework categories
            const onlyFields = transformedFields.map(
              (field: { code: string }) => field.code
            );
            // Also include contentLanguage if it exists (static filter)
            if (!onlyFields.includes("contentLanguage")) {
              onlyFields.push("contentLanguage");
            }

            setDynamicFilterFields({
              onlyFields,
              isOpenColapsed: onlyFields, // Open all filters by default
            });
          }
        } catch (error) {
          console.error("Error fetching framework data:", error);
          // Don't set fallback - let it be empty, framework will be fetched eventually
          // If framework fetch fails, onlyFields will be empty and FilterForm will show all available fields
        }

        setFilter({
          filters: youthnetContentFilter?.contentFilter,
          filterFramework,
          staticFilter,
        });
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "filter",
            JSON.stringify(youthnetContentFilter?.contentFilter)
          );
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch tenant info:", error);
      }
    };
    fetchTenantInfo();
  }, []);

  // Debounce search query to avoid too many API calls
  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearchQuery(value);
      }, 500),
    []
  );

  // Update debounced search when searchQuery changes
  useEffect(() => {
    debouncedSetSearch(searchQuery);
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [searchQuery, debouncedSetSearch]);

  // Clear search when tab changes
  useEffect(() => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    if (tab === "content" || tab === "Course" || tab === "groups") {
      setActiveTab(tab);
    }

    // Update URL with tab parameter
    const url = new URL(window.location.href);
    let tabIndex = 1;
    if (tab === "Course") {
      tabIndex = 0;
    } else if (tab === "content") {
      tabIndex = 1;
    } else if (tab === "groups") {
      tabIndex = 2;
    }
    url.searchParams.set("tab", tabIndex.toString());
    router.replace(url.pathname + url.search);
  };

  const handleProfileClick = () => {
    router.push("/profile");
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
    setAnchorEl(null);
  };

  const performLogout = () => {
    // Redirect to proper logout page which handles API logout and cookie clearing
    router.push("/logout");
  };

  return (
    <Layout
      onlyHideElements={["footer", "topBar"]}
    >
      {/* Custom Header with Logo, Language, and Search */}
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

        {/* Navigation Tabs with Search */}
        <Box
          sx={{
            borderBottom: "1px solid #E0E0E0",
            px: { xs: 2, sm: 3 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_event, newValue) => handleTabChange(newValue)}
            aria-label="Dashboard Tabs"
            sx={{
              flex: 1,
              "& .MuiTabs-indicator": {
                backgroundColor: "#E6873C",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab
              label={t("LEARNER_APP.DASHBOARD.COURSES") || "Courses"}
              value="Course"
              sx={{
                textTransform: "none",
                fontWeight: activeTab === "Course" ? 600 : 400,
                color: activeTab === "Course" ? "#E6873C" : "#666",
                fontSize: "16px",
                minHeight: 48,
                transition: "all 0.2s ease",
                "&:hover": {
                  color: "#E6873C",
                  backgroundColor: "rgba(230, 135, 60, 0.05)",
                },
              }}
            />
            <Tab
              label={t("LEARNER_APP.DASHBOARD.CONTENT") || "Content"}
              value="content"
              sx={{
                textTransform: "none",
                fontWeight: activeTab === "content" ? 600 : 400,
                color: activeTab === "content" ? "#E6873C" : "#666",
                fontSize: "16px",
                minHeight: 48,
                transition: "all 0.2s ease",
                "&:hover": {
                  color: "#E6873C",
                  backgroundColor: "rgba(230, 135, 60, 0.05)",
                },
              }}
            />
            <Tab
              label={t("LEARNER_APP.DASHBOARD.GROUPS") || "Groups"}
              value="groups"
              sx={{
                textTransform: "none",
                fontWeight: activeTab === "groups" ? 600 : 400,
                color: activeTab === "groups" ? "#E6873C" : "#666",
                fontSize: "16px",
                minHeight: 48,
                transition: "all 0.2s ease",
                "&:hover": {
                  color: "#E6873C",
                  backgroundColor: "rgba(230, 135, 60, 0.05)",
                },
              }}
            />
          </Tabs>
          
          {/* Search Bar - Positioned at right corner */}
          <Box 
            sx={{ 
              ml: 2,
              display: { xs: "none", sm: "block" },
            }}
          >
            <TextField
              placeholder={t("LEARNER_APP.CONTENT.SEARCH") || "Search"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#999", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery("")}
                      sx={{ p: 0.5 }}
                    >
                      <CloseIcon sx={{ fontSize: 18, color: "#999" }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                width: { xs: 150, sm: 200, md: 250 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#F5F5F5",
                  transition: "all 0.2s ease",
                  "& fieldset": {
                    borderColor: "#E0E0E0",
                    borderWidth: "1px",
                  },
                  "&:hover fieldset": {
                    borderColor: "#E6873C",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#E6873C",
                    borderWidth: "2px",
                  },
                },
                "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                  transition: "color 0.2s ease",
                },
                "&:hover .MuiInputAdornment-root .MuiSvgIcon-root": {
                  color: "#E6873C",
                },
                "&.Mui-focused .MuiInputAdornment-root .MuiSvgIcon-root": {
                  color: "#E6873C",
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          pt: { xs: 20, sm: 22 },
          minHeight: "100vh",
          backgroundColor: "#F5F5F5",
          pb: 4,
        }}
      >
        {/* Content Header Section - Show for Content and Course tabs */}
        {(activeTab === "content" || activeTab === "Course") && (
          <Box
            sx={{
              px: { xs: 2, sm: 3, md: 4, lg: 6 },
              py: { xs: 3, sm: 4 },
            }}
          >
            {/* Title - H1: 24-28px */}
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: "24px", sm: "26px", md: "28px" },
                color: "#1A1A1A",
                mb: 1,
              }}
            >
              {(() => {
                const tab = activeTab as "content" | "Course" | "groups";
                switch (tab) {
                  case "Course":
                    return t("LEARNER_APP.DASHBOARD.COURSES") || "Courses";
                  case "groups":
                    return t("LEARNER_APP.DASHBOARD.GROUPS") || "Groups";
                  default:
                    return t("LEARNER_APP.DASHBOARD.CONTENT") || "Content";
                }
              })()}
            </Typography>

            {/* Subtitle - Body: 14-16px */}
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: { xs: "14px", sm: "16px" },
                color: "#1A1A1A",
                mb: 3,
              }}
            >
              {(() => {
                const tab = activeTab as "content" | "Course" | "groups";
                switch (tab) {
                  case "Course":
                    return t("LEARNER_APP.DASHBOARD.COURSES_SUBTITLE") || "Build your financial skills, one course at a time.";
                  case "groups":
                    return t("LEARNER_APP.DASHBOARD.GROUPS_SUBTITLE") || "Join study groups and learn together.";
                  default:
                    return t("LEARNER_APP.DASHBOARD.CONTENT_SUBTITLE") || "Discover practical money lessons — watch, read, and explore.";
                }
              })()}
            </Typography>

          </Box>
        )}

        {/* Content Area */}
        <Grid container>
          <Grid item xs={12}>
            {activeTab === "groups" ? (
              <GroupsManager isLoading={isLoading} />
            ) : (
              <LearnerCourse
                title={undefined}
                activeTab={activeTab}
                isLoading={false}
                _content={{
                  pageName: "L1_Content",
                  onlyFields: dynamicFilterFields.onlyFields,
                  isOpenColapsed: dynamicFilterFields.isOpenColapsed,
                  staticFilter: {
                    se_domains:
                      typeof (filter.filters as { domain?: string | string[] })?.domain === "string"
                        ? [(filter.filters as { domain: string }).domain]
                        : (filter.filters as { domain?: string[] })?.domain,
                    program:
                      typeof (filter.filters as { program?: string | string[] })?.program === "string"
                        ? [(filter.filters as { program: string }).program]
                        : (filter.filters as { program?: string[] })?.program,
                    ...(filter.staticFilter || {}),
                  },
                  filterFramework: filter.filterFramework,
                  tab: activeTab === "Course" ? "Course" : "content",
                  query: debouncedSearchQuery,
                }}
              />
            )}
          </Grid>
        </Grid>
      </Box>
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
export default DashboardPage;
