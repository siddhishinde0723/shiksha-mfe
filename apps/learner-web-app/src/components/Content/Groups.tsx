"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Stack,
} from "@mui/material";
import { Group, School } from "@mui/icons-material";
import {
  getMyCohorts,
  transformCohortToGroup,
  getGroupContentCount,
} from "@learner/utils/API/GroupService";

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
          Loading groups...
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
          No groups available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Groups will appear here once they are created
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
          color: "#1F1B13",
        }}
      >
        Study Groups
      </Typography>

      <Grid container spacing={3}>
        {groups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                },
              }}
              onClick={() => handleGroupClick(group)}
            >
              <CardContent
                sx={{ flex: 1, display: "flex", flexDirection: "column", p: 3 }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: "#1F1B13",
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    hyphens: "auto",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minHeight: "2.6em", // Ensure consistent height for 2 lines
                  }}
                  title={group.name} // Show full name on hover
                >
                  {group.name}
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mt: "auto" }}>
                  {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                   <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                   <Typography variant="body2" color="text.secondary">
                     {group.memberCount} members
                   </Typography>
                 </Box> */}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <School sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {group.contentCount} contents
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Groups;
