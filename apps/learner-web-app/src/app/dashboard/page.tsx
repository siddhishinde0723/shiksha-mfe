"use client";
import React, { useEffect, useState } from "react";
import Layout from "@learner/components/Layout";
// import Header from '@learner/components/Header';
// If Header exists at a different path, update the import accordingly, for example:
import Header from "../../components/Header/Header";
import { Tabs, Tab, Typography, Box, Grid } from "@mui/material";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import { profileComplitionCheck } from "@learner/utils/API/userService";
import { getTenantInfo } from "@learner/utils/API/ProgramService";
import { gredientStyle } from "@learner/utils/style";
import LearnerCourse from "@learner/components/Content/LearnerCourse";
import { AccountCircleOutlined, Logout } from "@mui/icons-material";
import ProfileMenu from "../../components/ProfileMenu/ProfileMenu"; // Make sure this path is correct
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
// Or, if you don't need Header, remove this line and the <Header /> usage below.
// import SearchBar from "../../components/";
// import WelcomeMessage from "@learner/components/WelcomeMessage";
// import Filter from "@learner/components/Filter";
// import Tabs from "@learner/components/Tabs";
// import CourseList from "@learner/components/CourseList";
// import ContentList from "@learner/components/ContentList";

const DashboardPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("Course");
  const [filter, setFilter] = useState<Record<string, any> | null>(null);
  const [isLogin, setIsLogin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileCard, setIsProfileCard] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // For menu positioning
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [storedConfig, setStoredConfig] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const config = JSON.parse(localStorage.getItem("uiConfig") || "{}");
      setStoredConfig(config);
    }
  }, []);

  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        if (checkAuth()) {
          setIsLogin(true);
          const result = await profileComplitionCheck();
          console.log("Profile completion check result:", result);
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
        setTimeout(() => {
          setFilter({ filters: youthnetContentFilter?.contentFilter });
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "filter",
              JSON.stringify(youthnetContentFilter?.contentFilter)
            );
          }
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to fetch tenant info:", error);
      }
    };
    fetchTenantInfo();
  }, [pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
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
          Welcome, {typeof window !== "undefined" ? localStorage.getItem("firstName") : ""}!
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
            {filter && (
              <LearnerCourse
                title={
                  (typeof window !== "undefined" && localStorage.getItem("userProgram") === "Camp to Club")
                    ? "LEARNER_APP.COURSE.GET_STARTED_CLUB_COURSES"
                    : "LEARNER_APP.COURSE.GET_STARTED"
                }
                _content={{
                  pageName: "L1_Content",
                  onlyFields: [
                    "contentLanguage",
                    "se_subDomains",
                    "se_subjects",
                  ],
                  isOpenColapsed: [
                    "contentLanguage",
                    "se_subDomains",
                    "se_subjects",
                  ],
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
                  },
                  tab: activeTab,
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
