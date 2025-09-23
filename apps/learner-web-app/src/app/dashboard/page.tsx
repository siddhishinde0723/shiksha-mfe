"use client";
import React, { useEffect, useState, useRef } from "react";
import Layout from "@learner/components/Layout";
import { Tabs, Tab, Typography, Box, Grid } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import { profileComplitionCheck } from "@learner/utils/API/userService";
import { getTenantInfo } from "@learner/utils/API/ProgramService";
import { gredientStyle } from "@learner/utils/style";
import LearnerCourse from "@learner/components/Content/LearnerCourse";
import { AccountCircleOutlined } from "@mui/icons-material";
import ProfileMenu from "../../components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";

const DashboardPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("Course");
  const [filter, setFilter] = useState<Record<string, any>>({});
  const [isLogin, setIsLogin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileCard, setIsProfileCard] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // For menu positioning
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [storedConfig, setStoredConfig] = useState({});
  const [firstName, setFirstName] = useState("");
  const [userProgram, setUserProgram] = useState("");
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const config = JSON.parse(localStorage.getItem("uiConfig") || "{}");
      setStoredConfig(config);
      setFirstName(localStorage.getItem("firstName") || "");
      setUserProgram(localStorage.getItem("userProgram") || "");
      
      // Initialize activeTab from URL parameter
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get("tab");
      if (tabParam === "1") {
        setActiveTab("content");
      } else {
        setActiveTab("Course");
      }
    }
  }, []);

  useEffect(() => {
    // Prevent duplicate API calls in React StrictMode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const fetchTenantInfo = async () => {
      try {
        if (checkAuth()) {
          setIsLogin(true);
          const result = await profileComplitionCheck();
          setIsProfileCard(!result);
        } else {
          setIsLogin(false);
        }
        const res = await getTenantInfo();
        const youthnetContentFilter = res?.result.find(
          (program: any) => program.name === "YouthNet"
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
          const collectionFramework = youthnetContentFilter?.collectionFramework;
          const channelId = youthnetContentFilter?.channelId;
          
          if (collectionFramework) {
            const { filterContent, staticFilterContent } = await import('@shared-lib-v2/utils/AuthService');
            
            const [frameworkData, staticData] = await Promise.all([
              filterContent({ instantId: collectionFramework }),
              channelId ? staticFilterContent({ instantFramework: channelId }) : null
            ]);
            
            // Filter out invalid terms with template placeholders
            const cleanedFrameworkData = {
              ...frameworkData,
              framework: {
                ...frameworkData?.framework,
                categories: frameworkData?.framework?.categories?.map((category: any) => {
                  const originalTerms = category.terms || [];
                  const filteredTerms = originalTerms.filter((term: any) => {
                    const hasTemplate = term.code?.includes('{{') || term.name?.includes('{{');
                    const isLive = term.status === 'Live';
                    const isValid = !hasTemplate && isLive;
                    
                    if (!isValid) {
                      console.log(`🚫 Filtering out term: ${term.name} (${term.code}) - Template: ${hasTemplate}, Live: ${isLive}`);
                    }
                    
                    return isValid;
                  });
                  
                  console.log(`🔍 Category ${category.name}: ${originalTerms.length} original terms, ${filteredTerms.length} filtered terms`);
                  
                  return {
                    ...category,
                    terms: filteredTerms
                  };
                }) || []
              }
            };
            
            filterFramework = cleanedFrameworkData;
            staticFilter = staticData;
            
            // Debug: Log framework data
            console.log('🔍 Dashboard - Framework Data:', frameworkData);
            console.log('🔍 Dashboard - Framework Categories:', frameworkData?.framework?.categories);
            console.log('🔍 Dashboard - Framework Name:', (frameworkData?.framework as any)?.name);
            console.log('🔍 Dashboard - Static Data:', staticData);
            
            // Log each category with its terms
            if (frameworkData?.framework?.categories) {
              frameworkData.framework.categories.forEach((category: any, index: number) => {
                console.log(`🔍 Dashboard Category ${index + 1}: ${category.name} (${category.code}) - ${category.terms?.length || 0} terms`);
                if (category.terms) {
                  category.terms.forEach((term: any, termIndex: number) => {
                    console.log(`  📝 Dashboard Term ${termIndex + 1}: ${term.name} (${term.code})`);
                  });
                }
              });
            }
          }
        } catch (error) {
          console.error('Error fetching framework data:', error);
        }

        setFilter({ 
          filters: youthnetContentFilter?.contentFilter,
          filterFramework,
          staticFilter
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Update URL with tab parameter
    const url = new URL(window.location.href);
    const tabIndex = tab === "Course" ? 0 : 1;
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
    // Clear user session
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("firstName");
    }

    // Redirect to login page
    router.push("/login");
  };

  return (
    <Layout
      _topAppBar={{
        navLinks: [
          {
            title: "Profile",
            icon: <AccountCircleOutlined sx={{ width: 28, height: 28 }} />,
            to: (e: React.MouseEvent<HTMLElement>) =>
              setAnchorEl(e.currentTarget),
            isActive: pathname === "/profile",
            customStyle: {
              backgroundColor:
                pathname === "/profile" ? "#e0f7fa" : "transparent",
              borderRadius: 8,
            },
          },
        ],
      }}
    >
      <Box
        sx={{
          height: 24,
          display: "flex",
          alignItems: "center",
          py: "36px",
          px: "34px",
          bgcolor: "#fff",
        }}
      >
        <Typography
          variant="body1"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: 500,
            color: "#1F1B13",
            textTransform: "capitalize",
          }}
        >
          <span role="img" aria-label="wave">
            👋
          </span>
          Welcome, {firstName}!
        </Typography>
      </Box>
      <Box>
        <Tabs
          value={activeTab}
          onChange={(_event, newValue) => handleTabChange(newValue)}
          aria-label="Dashboard Tabs"
        >
          <Tab label="Courses" value="Course" />
          <Tab label="Content" value="content" />
        </Tabs>
        <Grid container style={gredientStyle}>
          <Grid item xs={12}>
            <LearnerCourse
              title={
                userProgram === "Camp to Club"
                  ? "LEARNER_APP.COURSE.GET_STARTED_CLUB_COURSES"
                  : "LEARNER_APP.COURSE.GET_STARTED"
              }
              activeTab={activeTab}
              isLoading={false}
              _content={{
                  pageName: "L1_Content",
                  onlyFields: [
                    "se_boards",
                    "se_mediums", 
                    "se_gradeLevels",
                    "se_subjects",
                    "contentLanguage",
                    "se_subDomains",
                  ],
                  isOpenColapsed: [], // Start collapsed - users can expand when needed
                  // Fix: Only spread if showContent exists and is an array
                  ...(Array.isArray((storedConfig as any).showContent) &&
                    (storedConfig as any).showContent.length === 2 &&
                    (storedConfig as any).showContent.includes("courses")
                    ? {}
                    : {}),
                  //   contentTabs:
                  //     activeTab === "courses"
                  //       ? ["Course"]
                  //       : ["Learning Resource"],
                  // }),
                  //   storedConfig.showContent.includes("contents")
                  //     ? { contentTabs: ["courses", "content"] }
                  //     : {}),
                  staticFilter: {
                    se_domains:
                      typeof filter.filters?.domain === "string"
                        ? [filter.filters?.domain]
                        : filter.filters?.domain,
                    program:
                      typeof filter.filters?.program === "string"
                        ? [filter.filters?.program]
                        : filter.filters?.program,
                    ...filter.staticFilter,
                  },
                  filterFramework: filter.filterFramework,
                  tab: activeTab,
                }}
              />
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
