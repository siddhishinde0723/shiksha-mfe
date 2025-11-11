"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
} from "@mui/material";
import { Group } from "@mui/icons-material";
import { useTranslation, ContentItem } from "@shared-lib";
import dynamic from "next/dynamic";
import {
  getMyCohorts,
  transformCohortToGroup,
  getGroupContentCount,
} from "@learner/utils/API/GroupService";

// Dynamically import ContentCard from content microfrontend
const ContentCard = dynamic(
  () => import("@content-mfes/components/Card/ContentCard").then((mod) => mod.default || (() => null)),
  { ssr: false }
);

interface CohortData {
  cohortStatus?: string;
  cohortMemberStatus?: string;
  [key: string]: string | number | boolean | undefined;
}

interface GroupItem {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  contentCount: number;
  imageUrl?: string;
  category?: string;
  createdDate?: string;
  creatorName?: string;
  creatorAvatar?: string;
}

interface GroupsProps {
  onGroupClick?: (group: GroupItem) => void;
  isLoading?: boolean;
}

const Groups: React.FC<GroupsProps> = ({ onGroupClick, isLoading = false }) => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch groups from API
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const response = await getMyCohorts();
        // Filter only active groups
        const activeGroups = response.result.filter(
          (cohort: CohortData) =>
            (cohort.cohortStatus === "active" || !cohort.cohortStatus) &&
            (cohort.cohortMemberStatus === "active" ||
              !cohort.cohortMemberStatus)
        );
        const transformedGroups = activeGroups.map(transformCohortToGroup);
        console.log("Transformed groups:", transformedGroups); // Debug log

        // Fetch content count for each group
        const groupsWithContentCount = await Promise.all(
          transformedGroups.map(async (group, index) => {
            console.log(`Processing group ${index + 1}:`, {
              id: group.id,
              name: group.name,
            }); // Debug log
            const contentCount = await getGroupContentCount(group.id);
            console.log(
              `Group ${group.name} (${group.id}) has ${contentCount} content items`
            ); // Debug log
            return {
              ...group,
              contentCount: contentCount,
            };
          })
        );

        console.log("Groups with content count:", groupsWithContentCount); // Debug log
        console.log(
          "Final groups data:",
          groupsWithContentCount.map((g) => ({
            id: g.id,
            name: g.name,
            contentCount: g.contentCount,
          }))
        ); // Debug log
        setGroups(groupsWithContentCount);
      } catch (error) {
        console.error("Error fetching groups:", error);
        // Fallback to empty array on error
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleGroupClick = (group: GroupItem) => {
    if (onGroupClick) {
      onGroupClick(group);
    }
  };

  if (loading || isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {t("LEARNER_APP.GROUPS.LOADING_GROUPS") || "Loading groups..."}
        </Typography>
      </Box>
    );
  }

  if (groups.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Group sx={{ fontSize: 64, color: "text.secondary" }} />
        <Typography variant="h6" color="text.secondary">
          {t("LEARNER_APP.GROUPS.NO_GROUPS_AVAILABLE") || "No groups available"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("LEARNER_APP.GROUPS.GROUPS_WILL_APPEAR") || "Groups will appear here once they are created"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontWeight: 500,
          color: "#1A1A1A",
        }}
      >
        {t("LEARNER_APP.GROUPS.STUDY_GROUPS") || "Study Groups"}
      </Typography>

      {/* Spacing: 24-32px between cards */}
      <Grid container spacing={{ xs: 3, sm: 3, md: 4 }}>
        {groups.map((group) => {
          // Map GroupItem to ContentItem format for ContentCard
          // Format description to include content count if description is missing
          const description = group.description || 
            (group.contentCount > 0 
              ? `${group.contentCount} ${group.contentCount === 1 ? "content" : "contents"} available`
              : "No content available");
          
          const contentItem: ContentItem = {
            identifier: group.id,
            name: group.name,
            mimeType: "application/vnd.ekstep.content-collection",
            posterImage: group.imageUrl || "",
            appIcon: group.imageUrl || "",
            description: description,
            keywords: [],
            gradeLevel: [],
            language: [],
            artifactUrl: "",
            contentType: "Course",
            // Format mimeTypesCount to show content count in metadata
            // The ContentCard will parse this and display it in the metadata section
            // We use a format that will be recognized as content items
            mimeTypesCount: group.contentCount > 0 
              ? JSON.stringify({
                  "application/vnd.ekstep.content-collection": group.contentCount,
                })
              : undefined,
            // Add a custom property to indicate this is a group for custom rendering if needed
            // This can be used to customize the metadata display
          } as ContentItem & { isGroup?: boolean; groupContentCount?: number };
          
          // Add group-specific properties
          (contentItem as any).isGroup = true;
          (contentItem as any).groupContentCount = group.contentCount;
          (contentItem as any).groupMemberCount = group.memberCount;

          return (
            <Grid item xs={6} sm={6} md={3} lg={3} xl={3} key={group.id}>
              {ContentCard ? (
                <ContentCard
                  item={contentItem}
                  type="Course"
                  default_img="/images/image_ver.png"
                  handleCardClick={() => handleGroupClick(group)}
                  trackData={[]}
                  _card={{
                    sx: {
                      height: "100%",
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                      border: "1px solid #E0E0E0",
                      borderRadius: "10px",
                      "&:hover": {
                        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.12)",
                        borderColor: "#E6873C",
                        transform: "translateY(-2px)",
                      },
                    },
                  }}
                />
              ) : (
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    "&:hover": {
                      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                    },
                  }}
                  onClick={() => handleGroupClick(group)}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: "#1A1A1A",
                    }}
                  >
                    {group.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {group.contentCount} contents
                  </Typography>
                </Box>
              )}
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default Groups;
