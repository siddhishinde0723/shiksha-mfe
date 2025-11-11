"use client";

import React, { useState } from "react";
import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { SUPPORTED_MIME_TYPES } from "@learner/utils/helper";
import Groups from "./Groups";
import GroupContent from "./GroupContent";

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

interface GroupContentItem {
  id: string;
  title: string;
  description: string;
  type: "video" | "document" | "quiz" | "assignment" | "course";
  duration?: string;
  progress?: number;
  imageUrl?: string;
  isCompleted?: boolean;
  difficulty?: "beginner" | "intermediate" | "advanced";
  mimeType?: string;
  identifier?: string;
  name?: string;
  posterImage?: string;
}

interface GroupsManagerProps {
  isLoading?: boolean;
}

const GroupsManager: React.FC<GroupsManagerProps> = ({ isLoading = false }) => {
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [view, setView] = useState<"list" | "content">("list");
 
  const router = useRouter();

  const handleGroupClick = (group: GroupItem) => {
    setSelectedGroup(group);
    setView("content");
  };

  const handleBackToList = () => {
    setSelectedGroup(null);
    setView("list");
  };

  const handleContentClick = (content: GroupContentItem) => {
    console.log("Content clicked:", content);

    try {
      // Get current URL for activeLink (include tab parameter)
      const activeLinkUrl = window.location.pathname + window.location.search;

      // Map content type to MIME type for checking
      // Match the same logic as in course/content tabs
      const mimeTypeMap: Record<string, string> = {
        video: "video/mp4", // Use a supported video mimeType
        document: "application/vnd.ekstep.html-archive",
        quiz: "application/vnd.sunbird.questionset",
        course: "application/vnd.ekstep.content-collection",
        assignment: "application/vnd.ekstep.html-archive",
      };

      const mimeType =
        content.mimeType ||
        mimeTypeMap[content.type] ||
        "application/vnd.ekstep.html-archive";

      // Match the exact logic from course/content tabs (List.tsx):
      // If mimeType is in SUPPORTED_MIME_TYPES -> go to player
      // Otherwise -> go to content details (courses/collections are not in SUPPORTED_MIME_TYPES)
      if (SUPPORTED_MIME_TYPES.includes(mimeType)) {
        // Navigate to player for supported content types
        const playerUrl = `/player/${
          content.id || content.identifier
        }?activeLink=${encodeURIComponent(activeLinkUrl)}`;
        router.push(playerUrl);
      } else {
        // Navigate to content details for courses/collections and unsupported content types
        const contentDetailsUrl = `/content-details/${
          content.id || content.identifier
        }?activeLink=${encodeURIComponent(activeLinkUrl)}`;
        router.push(contentDetailsUrl);
      }
    } catch (error) {
      console.error("Failed to handle content click:", error);
      // Fallback to content details page
      router.push(`/content-details/${content.id || content.identifier}`);
    }
  };

  return (
    <Box>
      {view === "list" ? (
        <Groups onGroupClick={handleGroupClick} isLoading={isLoading} />
      ) : (
        selectedGroup && (
          <GroupContent
            groupId={selectedGroup.id}
            groupName={selectedGroup.name}
            onBack={handleBackToList}
            onContentClick={handleContentClick}
            isLoading={isLoading}
            groupMemberCount={selectedGroup.memberCount}
            groupContentCount={selectedGroup.contentCount}
          />
        )
      )}
    </Box>
  );
};

export default GroupsManager;
