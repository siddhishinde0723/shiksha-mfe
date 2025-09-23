import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import { red } from "@mui/material/colors";
import { Box, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { CircularProgressWithLabel } from "../Progress/CircularProgressWithLabel";

/**
 * Transforms image URLs from Azure Blob Storage to AWS S3 URLs
 * @param imageUrl - The image URL to transform
 * @returns Transformed image URL or fallback to logo.png
 */
const transformImageUrl = (imageUrl: string): string => {
  console.log("🖼️ CommonCard transformImageUrl - Input:", imageUrl);
  
  if (!imageUrl) {
    console.log("🖼️ CommonCard transformImageUrl - No imageUrl, returning fallback");
    return '/logo.png';
  }

  if (imageUrl.includes('https://sunbirdsaaspublic.blob.core.windows.net')) {
    console.log("🖼️ CommonCard transformImageUrl - Azure URL detected");
    
    // Handle double domain pattern
    if (
      imageUrl.includes(
        'https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net'
      )
    ) {
      console.log("🖼️ CommonCard transformImageUrl - Double domain pattern detected");
      // Extract everything after the second domain
      const urlParts = imageUrl.split(
        'https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net/'
      );
      if (urlParts.length > 1) {
        const pathAfterSecondDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterSecondDomain.replace(
          /^content\/content\//,
          ''
        );
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ''
        );
        // Transform to AWS S3 URL with the new pattern
        const transformedUrl = `https://s3.ap-south-1.amazonaws.com/saas-prod/content/${cleanPath}`;
        console.log("🖼️ CommonCard transformImageUrl - Double domain transformed:", transformedUrl);
        return transformedUrl;
      }
    } else {
      console.log("🖼️ CommonCard transformImageUrl - Single domain pattern detected");
      // Handle single domain pattern
      const urlParts = imageUrl.split(
        'https://sunbirdsaaspublic.blob.core.windows.net/'
      );
      if (urlParts.length > 1) {
        const pathAfterDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterDomain.replace(/^content\/content\//, '');
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ''
        );
        // Transform to AWS S3 URL with the new pattern
        const transformedUrl = `https://s3.ap-south-1.amazonaws.com/saas-prod/content/${cleanPath}`;
        console.log("🖼️ CommonCard transformImageUrl - Single domain transformed:", transformedUrl);
        return transformedUrl;
      }
    }
  }

  console.log("🖼️ CommonCard transformImageUrl - No transformation needed, returning original:", imageUrl);
  return imageUrl;
};
export interface ContentItem {
  name: string;
  gradeLevel: string[];
  language: string[];
  artifactUrl: string;
  identifier: string;
  appIcon: string;
  appicon?: string; // lowercase variant
  contentType: string;
  mimeType: string;
  description: string;
  posterImage: string;
  leafNodes?: any[];
  children?: any[];
}
interface CommonCardProps {
  title: string;
  avatarLetter?: string;
  avatarColor?: string;
  subheader?: string;
  image?: string;
  imageAlt?: string;
  content?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  orientation?: "vertical" | "horizontal";
  minheight?: string;
  TrackData?: any[];
  item: ContentItem;
  type: string;
  onClick?: () => void;
}
export const getLeafNodes = (node: any) => {
  const result = [];

  // If the node has leafNodes, add them to the result array
  if (node?.leafNodes) {
    result.push(...node.leafNodes);
  }

  // If the node has children, iterate through them and recursively collect leaf nodes
  if (node?.children) {
    node.children.forEach((child: any) => {
      result.push(...getLeafNodes(child));
    });
  }

  return result;
};

export const CommonCard: React.FC<CommonCardProps> = ({
  avatarLetter,
  avatarColor = red[500],
  title,
  subheader,
  image,
  imageAlt,
  content,
  actions,
  children,
  orientation,
  minheight,
  TrackData,
  item,
  type,
  onClick,
}) => {
  console.log("🎯 CommonCard - Props received:", {
    title,
    image,
    imageAlt,
    item: {
      name: item?.name,
      posterImage: item?.posterImage,
      appIcon: item?.appIcon,
      appicon: item?.appicon
    },
    type
  });

  const [trackCompleted, setTrackCompleted] = React.useState(0);
  const [trackProgress, setTrackProgress] = React.useState(100);

  React.useEffect(() => {
    const init = () => {
      try {
        if (TrackData) {
          const result = TrackData?.find((e) => e.courseId === item.identifier);
          if (type === "Course") {
            const leafNodes = getLeafNodes(item ?? []);
            const completedCount = result?.completed_list?.length || 0;
            const percentage =
              leafNodes.length > 0
                ? Math.round((completedCount / leafNodes.length) * 100)
                : 0;
            setTrackProgress(percentage);
            setTrackCompleted(percentage);
          } else {
            setTrackCompleted(result?.completed ? 100 : 0);
          }
        }
      } catch (e) {
        console.log("error", e);
      }
    };
    init();
  }, [TrackData, item, type]);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: orientation === "horizontal" ? "column" : "row",
        height: minheight || "auto",
        cursor: onClick ? "pointer" : "default",
        borderRadius: "12px",
        bgcolor: "#FEF7FF",
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        "&:hover": {
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
        },
        "@media (max-width: 600px)": {
          flexDirection: "column",
        },
      }}
      onClick={onClick}
    >
      {/* Image and Progress Overlay */}
      <Box sx={{ position: "relative", width: "100%" }}>
        {(() => {
          const finalImageUrl = transformImageUrl(image || '');
          console.log("🖼️ CommonCard - Input image:", image);
          console.log("🖼️ CommonCard - Image type:", typeof image);
          console.log("🖼️ CommonCard - Image length:", image?.length);
          console.log("🖼️ CommonCard - Final image URL:", finalImageUrl);
          console.log("🖼️ CommonCard - Testing logo URL:", '/logo.png');
          return (
            <CardMedia
              component="img"
              image={finalImageUrl}
              alt={imageAlt || "Image"}
              sx={{
                width: "100%",
                height: orientation === "horizontal" ? "220px" : "auto",
                objectFit: "contain", // Changed from cover to contain to prevent cropping
                padding: "10px", // Added padding to prevent cropping
                backgroundColor: "#f5f5f5", // Added background color for better visibility
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "@media (max-width: 600px)": {
                  height: "180px",
                  padding: "8px", // Smaller padding on mobile
                },
              }}
            />
          );
        })()}

        {/* Progress Bar Overlay */}
        {trackProgress >= 0 && (
          <Box
            sx={{
              position: "absolute",
              height: "40px",
              top: 0,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center", // Center the progress horizontally
              background: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <Box
              sx={{
                p: "0px 5px",
                fontSize: "12px",
                fontWeight: "bold",
                color: trackCompleted === 100 ? "#21A400" : "#FFB74D",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "center", // Center the content
              }}
            >
              {type === "Course" ? (
                <>
                  <CircularProgressWithLabel
                    value={trackProgress ?? 0}
                    _text={{
                      sx: {
                        color: trackCompleted === 100 ? "#21A400" : "#FFB74D",
                        fontSize: "10px",
                      },
                    }}
                    sx={{
                      color: trackCompleted === 100 ? "#21A400" : "#FFB74D",
                    }}
                    size={35}
                    thickness={2}
                  />
                  {trackCompleted >= 100 ? (
                    <>
                      <CheckCircleIcon sx={{ color: "#21A400" }} />
                      {`Completed`}
                    </>
                  ) : trackProgress > 0 && trackProgress < 100 ? (
                    `In progress`
                  ) : (
                    `Enrolled`
                  )}
                </>
              ) : (
                <>
                  <CircularProgressWithLabel
                    value={trackProgress ?? 0}
                    _text={{
                      sx: {
                        color: trackCompleted === 100 ? "#21A400" : "#FFB74D",
                        fontSize: "10px",
                      },
                    }}
                    sx={{
                      color: trackCompleted === 100 ? "#21A400" : "#FFB74D",
                    }}
                    size={35}
                    thickness={2}
                  />
                  {trackCompleted >= 100 ? (
                    <>
                      <CheckCircleIcon sx={{ color: "#21A400" }} />
                      {`Completed`}
                    </>
                  ) : trackProgress > 0 && trackProgress < 100 ? (
                    `In progress`
                  ) : (
                    `Enrolled`
                  )}
                </>
              )}
            </Box>
          </Box>
        )}
      </Box>

      <CardHeader
        avatar={
          avatarLetter && (
            <Avatar sx={{ bgcolor: avatarColor }} aria-label="avatar">
              {avatarLetter}
            </Avatar>
          )
        }
        title={
          <Typography
            sx={{
              fontSize: "16px",
              whiteSpace: "wrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 1,
              paddingLeft: "5px",
            }}
          >
            {title}
          </Typography>
        }
        subheader={
          <Typography variant="h6" sx={{ fontSize: "14px" }}>
            {subheader}
          </Typography>
        }
      />
      {content && (
        <CardContent
          sx={{
            display: "flex",
            paddingBottom: 0,
            paddingTop: 0,
            paddingX: 0,
            overflow: "hidden",
            maxWidth: "100%",
            "&:last-child": {
              paddingBottom: 0,
            },
            // height: '50px',
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Typography
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700 }}>
                Description:
              </span>{" "}
              {content}
            </Typography>
          </Box>
        </CardContent>
      )}
      {children && <CardContent>{children}</CardContent>}
      {actions && (
        <CardActions>
          <Button variant="contained">{actions}</Button>
        </CardActions>
      )}
    </Card>
  );
};
