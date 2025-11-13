/* eslint-disable react-hooks/rules-of-hooks */
import React, { useMemo } from "react";
import { Box, CSSObject, useTheme, Card, CardMedia, Typography, LinearProgress } from "@mui/material";
import { CommonCard, ContentItem } from "@shared-lib";
import AppConst from "../../utils/AppConst/AppConst";
import { getBestImageUrl } from "../../utils/imageUtils";
import { StatusIcon } from "../CommonCollapse";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import PeopleIcon from "@mui/icons-material/People";

// Extended ContentItem interface to include lowercase appicon
interface ExtendedContentItem extends ContentItem {
  appicon?: string;
  keywords?: string[];
}

const ContentCard = ({
  item,
  type,
  default_img,
  _card,
  handleCardClick,
  trackData,
}: {
  item: ExtendedContentItem;
  type: any;
  default_img?: string;
  _card?: any;
  handleCardClick: (content: ExtendedContentItem, e?: any) => void;
  trackData?: [];
}) => {
  const { isWrap } = _card ?? {};
  if (_card?.cardComponent) {
    return (
      <CardWrap isWrap={isWrap && type === "Course"} _card={_card}>
        <_card.cardComponent
          item={item}
          type={type}
          default_img={default_img}
          _card={_card}
          handleCardClick={handleCardClick}
          trackData={trackData}
        />
      </CardWrap>
    );
  }
  // Get thumbnail - prioritize video thumbnails and topic-specific images
  const finalImageUrl =
    (getBestImageUrl(item, process.env.NEXT_PUBLIC_MIDDLEWARE_URL) ||
      item?.posterImage ||
      default_img) ??
    `${AppConst.BASEPATH}/assests/images/image_ver.png`;
  const progressData = useMemo(() => {
    // Don't calculate progress for group cards themselves (but show progress for content inside groups)
    if ((item as any)?.isGroup) {
      return { progress: 0, status: "not_started" };
    }

    if (!trackData || !Array.isArray(trackData)) {
      return { progress: 0, status: "not_started" };
    }

    const trackItem = trackData.find(
      (track: any) => track.courseId === item.identifier
    );

    if (!trackItem) {
      return { progress: 0, status: "not_started" };
    }
    let progress = 0;
    let status = "not_started";

    // For courses, calculate based on completed_list
    if (
      type === "Course" &&
      trackItem &&
      Array.isArray((trackItem as any).completed_list)
    ) {
      // Get leaf nodes count if available
      const getLeafNodes = (node: any): any[] => {
        if (!node) return [];
        if (!node.children || node.children.length === 0) {
          return [node];
        }
        return node.children.flatMap((child: any) => getLeafNodes(child));
      };

      // Fix: Ensure completed_list and percentage are checked robustly
      const leafNodes = Array.isArray(getLeafNodes(item)) ? getLeafNodes(item) : [];
      const totalItems = leafNodes.length > 0 ? leafNodes.length : 1;
      const completedList = Array.isArray((trackItem as any)?.completed_list)
        ? (trackItem as any)?.completed_list
        : [];
      const completedCount = completedList.length;
      progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    } else if (
      trackItem &&
      (typeof (trackItem as any).percentage === "number" || typeof (trackItem as any).percentage === "string")
    ) {
      // Use percentage if available and parse if necessary
      const pct = (trackItem as any).percentage;
      progress = Math.min(100, Math.max(0, typeof pct === "string" ? parseFloat(pct) : pct));
    } else {
      // For regular content, check completion status
      const completed = (trackItem as any)?.completed;
      const inProgress = (trackItem as any)?.in_progress;
      progress = completed ? 100 : inProgress ? 50 : 0;
    }

    // Determine status
    if (progress === 100) {
      status = "completed";
    } else if (progress > 0) {
      status = "in_progress";
    } else {
      status = "not_started";
    }

    return { progress, status };
  }, [trackData, item, type]);

  // Get course metadata (videos, quizzes, duration)
  const getCourseMetadata = () => {
    const metadata: string[] = [];
    
    // Check if this is a group card (not group content)
    const isGroup = (item as any)?.isGroup || false;
    const groupContentCount = (item as any)?.groupContentCount;
    const groupMemberCount = (item as any)?.groupMemberCount;
    
    // For groups (group cards in groups list), show both content count and member count
    if (isGroup) {
      if (groupContentCount !== undefined && groupContentCount > 0) {
        metadata.push(`${groupContentCount} ${groupContentCount === 1 ? "Content" : "Contents"}`);
      }
      if (groupMemberCount !== undefined && groupMemberCount > 0) {
        metadata.push(`${groupMemberCount} ${groupMemberCount === 1 ? "Member" : "Members"}`);
      }
      return metadata;
    }
    
    // For group content and regular content, show normal content metadata (videos, quizzes, duration)
    
    // Parse mimeTypesCount if it's a string
    let videoCount = 0;
    let quizCount = 0;

    // Access mimeTypesCount robustly even if not on ExtendedContentItem type
    const mimeTypesCountRaw = (item && (item as any).mimeTypesCount);

    if (mimeTypesCountRaw) {
      try {
        const mimeTypesCount = typeof mimeTypesCountRaw === "string"
          ? JSON.parse(mimeTypesCountRaw)
          : mimeTypesCountRaw;
        
        // Count videos
        Object.keys(mimeTypesCount).forEach((mimeType) => {
          if (mimeType?.includes("video") || mimeType === "video/x-youtube") {
            videoCount += mimeTypesCount[mimeType] || 0;
          }
          if (mimeType?.includes("quiz") || mimeType?.includes("assessment")) {
            quizCount += mimeTypesCount[mimeType] || 0;
          }
        });
      } catch (e) {
        console.error("Error parsing mimeTypesCount:", e);
      }
    }

    // Fallback: Count from children if mimeTypesCount not available
    if (videoCount === 0 && quizCount === 0 && type === "Course" && item.children) {
      const countVideos = (node: any): number => {
        if (!node) return 0;
        let count = 0;
        if (node.mimeType?.includes("video") || node.mimeType === "video/x-youtube") {
          count = 1;
        }
        if (node.children && Array.isArray(node.children)) {
          count += node.children.reduce((sum: number, child: any) => sum + countVideos(child), 0);
        }
        return count;
      };

      const countQuizzes = (node: any): number => {
        if (!node) return 0;
        let count = 0;
        if (node.mimeType?.includes("quiz") || node.mimeType?.includes("assessment")) {
          count = 1;
        }
        if (node.children && Array.isArray(node.children)) {
          count += node.children.reduce((sum: number, child: any) => sum + countQuizzes(child), 0);
        }
        return count;
      };

      videoCount = countVideos(item);
      quizCount = countQuizzes(item);
    }

    // Format metadata
    if (videoCount > 0) {
      metadata.push(`${videoCount} ${videoCount === 1 ? "Video" : "Videos"}`);
    }
    if (quizCount > 0) {
      metadata.push(`${quizCount} ${quizCount === 1 ? "Quiz" : "Quizzes"}`);
    }

    // Add duration
    let duration: number | string | undefined;
    if ("duration" in item && typeof item.duration === "number") {
      duration = item.duration;
    } else if ("timeLimit" in item && typeof (item as any).timeLimit === "number") {
      duration = (item as any).timeLimit;
    }

    if (duration) {
      const durationStr = typeof duration === "number" 
        ? `${Math.round(duration / 60)}min` 
        : duration;

      metadata.push(durationStr);
    }

    return metadata;
  };

  const courseMetadata = getCourseMetadata();

  // Get course description (only use properties that exist on ExtendedContentItem)
  const courseDescription = item?.description || "";

  // Determine if content is new (only if createdOn exists on item)
  const isNew = (item as any)?.createdOn &&
    new Date((item as any).createdOn).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;


  return (
    <CardWrap isWrap={isWrap && type === "Course"} _card={_card}>
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px", // 8-12px range, using 10px
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)", // Subtle shadow for depth
          border: "1px solid #E0E0E0",
          cursor: "pointer",
          height: "100%",
          transition: "all 0.3s ease",
          position: "relative",
          "&:hover": {
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.12)",
            borderColor: "#E6873C",
            transform: "translateY(-2px)",
          },
          ..._card?.sx,
        }}
        onClick={(e: any) => handleCardClick(item, e)}
      >
        {/* Thumbnail */}
        <Box sx={{ position: "relative", width: "100%" }}>
          <CardMedia
            component="div"
            sx={{
              width: "100%",
              height: "180px",
              backgroundColor: "#F5F5F5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {finalImageUrl && finalImageUrl !== `${AppConst.BASEPATH}/assests/images/image_ver.png` ? (
              <Box
                component="img"
                src={finalImageUrl}
                alt={item?.name}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <ImageIcon sx={{ fontSize: 48, color: "#1A1A1A", opacity: 0.3 }} />
            )}

            {/* NEW Badge with Orange Overlay */}
            {isNew && (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  backgroundColor: "#E6873C",
                  color: "#FFF",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  zIndex: 1,
                  boxShadow: "0 2px 8px rgba(230, 135, 60, 0.3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                NEW
              </Box>
            )}
            {/* Orange overlay for highlighted cards - 10-20% opacity (using 15%) */}
            {isNew && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(230, 135, 60, 0.15)", // 15% opacity overlay
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
            )}
          </CardMedia>
        </Box>

        {/* Content Section - 16-20px padding (using 18px = 2.25 * 8px) */}
        <Box sx={{ p: 2.25, flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Course Title - H2: 20-22px, Bold, 1 line max */}
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "20px",
              lineHeight: "28px",
              color: "#1A1A1A",
              mb: 0.75,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item?.name || "Untitled"}
          </Typography>

          {/* Course Description - Body: 14-16px */}
          {courseDescription && (
            <Typography
              sx={{
                fontSize: "14px",
                color: "#1A1A1A",
                fontWeight: 400,
                mb: 1.5,
                lineHeight: "20px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {courseDescription}
            </Typography>
          )}

          {/* Course Details - Duration and Videos/Quizzes */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
              flexWrap: "wrap",
            }}
          >
            {/* Duration - Icons black by default, orange for active/selected */}
            {courseMetadata.find((m) => m.includes("min")) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 16, color: "#1A1A1A" }} />
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#1A1A1A",
                    fontWeight: 500,
                  }}
                >
                  {courseMetadata.find((m) => m.includes("min"))}
                </Typography>
              </Box>
            )}

            {/* Videos, Quizzes, or Contents (for groups) */}
            {(courseMetadata.find((m) => m.includes("Video")) || 
              courseMetadata.find((m) => m.includes("Quiz")) ||
              courseMetadata.find((m) => m.includes("Content"))) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <VideoLibraryIcon sx={{ fontSize: 16, color: "#1A1A1A" }} />
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#1A1A1A",
                    fontWeight: 500,
                  }}
                >
                  {courseMetadata
                    .filter((m) => m.includes("Video") || m.includes("Quiz") || m.includes("Content"))
                    .join(", ")}
                </Typography>
              </Box>
            )}

            {/* Members (for groups) */}
            {courseMetadata.find((m) => m.includes("Member")) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <PeopleIcon sx={{ fontSize: 16, color: "#1A1A1A" }} />
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#1A1A1A",
                    fontWeight: 500,
                  }}
                >
                  {courseMetadata.find((m) => m.includes("Member"))}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Additional Content Details - Keywords, Grade Level, Medium, Subject, etc. */}
          {((item as any)?.keywords?.length > 0 
           ) && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                mb: 2,
              }}
            >
              {/* Keywords/Tags */}
              {(item as any)?.keywords?.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {(item as any).keywords.slice(0, 3).map((keyword: string, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        backgroundColor: "#F5F5F5",
                        color: "#1A1A1A",
                        px: 1,
                        py: 0.25,
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {keyword}
                    </Box>
                  ))}
                </Box>
              )}            
            </Box>
          )}

          {/* Progress Status Bar - Hide only for group cards (show progress for content inside groups) */}
          {!(item as any)?.isGroup && (
            <Box sx={{ mt: "auto" }}>
              {progressData.status === "not_started" ? (
              // Not Started - Grey empty bar with "Not Started" text
              <Box>
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#1A1A1A",
                    fontWeight: 400,
                    mb: 0.5,
                  }}
                >
                  Not Started
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={0}
                  sx={{
                    height: 8,
                    borderRadius: "4px",
                    backgroundColor: "#F5F5F5",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#E0E0E0",
                    },
                  }}
                />
              </Box>
            ) : progressData.status === "completed" ? (
              // Completed - Green filled bar with "Complete" text
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#4CAF50",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, color: "#4CAF50" }} />
                    Complete
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#4CAF50",
                      fontWeight: 600,
                    }}
                  >
                    100%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{
                    height: 8,
                    borderRadius: "4px",
                    backgroundColor: "#F5F5F5",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#4CAF50",
                      borderRadius: "4px",
                    },
                  }}
                />
              </Box>
            ) : (
              // In Progress - Orange filled bar with progress percentage
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#E6873C",
                      fontWeight: 600,
                    }}
                  >
                    In Progress
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#E6873C",
                      fontWeight: 600,
                    }}
                  >
                    {progressData.progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressData.progress}
                  sx={{
                    height: 8,
                    borderRadius: "4px",
                    backgroundColor: "#F5F5F5",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#E6873C",
                      borderRadius: "4px",
                      boxShadow: "0 2px 4px rgba(230, 135, 60, 0.3)",
                    },
                  }}
                />
              </Box>
            )}
            </Box>
          )}
        </Box>
      </Card>
    </CardWrap>
  );
};

export default ContentCard;

export const CardWrap = ({
  children,
  isWrap,
  _card,
}: {
  children: React.ReactNode;
  isWrap?: boolean;
  _card?: any;
}) => {
  const theme = useTheme();
  const borderRadius = (
    theme?.components?.MuiCard?.styleOverrides?.root as CSSObject
  )?.borderRadius;
  if (!isWrap) {
    return children;
  }
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        mt: 1,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -8,
          zIndex: 0,
          width: _card?.sx?.width ?? "100%",
          px: 2,
        }}
      >
        <Box
          sx={{
            border: "1px solid #fff",
            boxShadow: "2px 0px 6px 2px #00000026, 1px 0px 2px 0px #0000004D",
            backgroundColor: "#DED8E1",
            height: "32px",
            borderRadius: borderRadius,
          }}
        />
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: -4,
          zIndex: 0,
          width: _card?.sx?.width ?? "100%",
          px: 1,
        }}
      >
        <Box
          sx={{
            border: "1px solid #fff",
            boxShadow: "2px 0px 6px 2px #00000026, 1px 0px 2px 0px #0000004D",
            backgroundColor: "#DED8E1",
            height: "32px",
            borderRadius: borderRadius,
          }}
        />
      </Box>
      <Box sx={{ zIndex: 1, width: _card?.sx?.width ?? "100%" }}>
        {children}
      </Box>
    </Box>
  );
};
