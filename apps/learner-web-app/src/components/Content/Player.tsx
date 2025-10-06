/* eslint-disable @nx/enforce-module-boundaries */
// pages/content-details/[identifier].tsx

"use client";
import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Avatar, Box, Button, IconButton, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
// import { ContentSearch } from '@learner/utils/API/contentService';
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import {
  ExpandableText,
  findCourseUnitPath,
  useTranslation,
} from "@shared-lib";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchContent } from "@learner/utils/API/contentService";
import BreadCrumb from "@content-mfes/components/BreadCrumb";
import { hierarchyAPI } from "@content-mfes/services/Hierarchy";
import { transformImageUrl } from "@learner/utils/imageUtils";

const CourseUnitDetails = dynamic(() => import("@CourseUnitDetails"), {
  ssr: false,
});
const App = ({
  userIdLocalstorageName,
  contentBaseUrl,
  _config,
}: {
  userIdLocalstorageName?: string;
  contentBaseUrl?: string;
  _config?: any;
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const { identifier, courseId, unitId } = params || {}; // string | string[] | undefined
  const [item, setItem] = useState<{ content?: any; [key: string]: any }>({});
  const [breadCrumbs, setBreadCrumbs] = useState<any>();
  const [isShowMoreContent, setIsShowMoreContent] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  let activeLink = null;
  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    activeLink = searchParams.get("activeLink");
  }
  const retryContentLoad = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      const response = await fetchContent(identifier);
      
      if (response && (response.name === 'AxiosError' || response.isAxiosError)) {
        console.error('Retry failed - Error loading content:', response);
        // Don't retry more than 3 times
        if (retryCount >= 2) {
          const isServiceUnavailable = response.status === 503;
          const errorMessage = isServiceUnavailable 
            ? 'Service temporarily unavailable. Please try again in a few minutes.'
            : 'This content is temporarily unavailable. Please try again later.';
          
          const fallbackContent = {
            identifier: identifier,
            name: isServiceUnavailable ? 'Service Unavailable' : 'Content Unavailable',
            description: errorMessage,
            mimeType: 'application/vnd.ekstep.html-archive',
            appIcon: '/images/image_ver.png',
            posterImage: '/images/image_ver.png',
            status: 'Live',
            error: true,
            errorMessage: response.message,
            errorStatus: response.status,
            errorCode: response.code,
            canRetry: true
          };
          
          setItem({ content: fallbackContent });
        }
      } else {
        setItem({ content: response });
        setRetryCount(0);
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await fetchContent(identifier);
        
        // Check if response is an error object
        if (response && (response.name === 'AxiosError' || response.isAxiosError)) {
          console.error('Error loading content:', response);
          
          // For 503 errors, show a more specific message
          const isServiceUnavailable = response.status === 503;
          const errorMessage = isServiceUnavailable 
            ? 'Service temporarily unavailable. Please try again in a few minutes.'
            : 'This content is temporarily unavailable. Please try again later.';
          
          // Create fallback content object for the player
          const fallbackContent = {
            identifier: identifier,
            name: isServiceUnavailable ? 'Service Unavailable' : 'Content Unavailable',
            description: errorMessage,
            mimeType: 'application/vnd.ekstep.html-archive',
            appIcon: '/images/image_ver.png',
            posterImage: '/images/image_ver.png',
            status: 'Live',
            error: true,
            errorMessage: response.message,
            errorStatus: response.status,
            errorCode: response.code,
            canRetry: retryCount < 2
          };
          
          setItem({ content: fallbackContent });
          console.log('Using fallback content due to API error:', response.status, response.message);
        } else {
          setItem({ content: response });
        }
        
        if (unitId) {
          try {
            const course = await hierarchyAPI(courseId as string);
            const breadcrum = findCourseUnitPath({
              contentBaseUrl: contentBaseUrl,
              node: course,
              targetId: identifier as string,
              keyArray: [
                "name",
                "identifier",
                "mimeType",
                {
                  key: "link",
                  suffix: activeLink
                    ? `?activeLink=${encodeURIComponent(activeLink)}`
                    : "",
                },
              ],
            });

            setBreadCrumbs(breadcrum?.slice(0, -1));
          } catch (breadcrumbError) {
            console.error('Error fetching breadcrumbs:', breadcrumbError);
            setBreadCrumbs([]);
          }
        } else {
          setBreadCrumbs([]);
        }
      } catch (error) {
        console.error('Error in fetch function:', error);
        
        // Create fallback content for any other errors
        const fallbackContent = {
          identifier: identifier,
          name: 'Content Unavailable',
          description: 'This content is temporarily unavailable. Please try again later.',
          mimeType: 'application/vnd.ekstep.html-archive',
          appIcon: '/images/image_ver.png',
          posterImage: '/images/image_ver.png',
          status: 'Live',
          error: true,
          errorMessage: 'Failed to load content'
        };
        
        setItem({ content: fallbackContent });
        setBreadCrumbs([]);
      }
    };
    fetch();
  }, [identifier, unitId, courseId, activeLink, contentBaseUrl, userIdLocalstorageName]);

  if (!identifier) {
    return <div>Loading...</div>;
  }
  const onBackClick = () => {
    if (breadCrumbs?.length > 1) {
      if (breadCrumbs?.[breadCrumbs.length - 1]?.link) {
        router.push(breadCrumbs?.[breadCrumbs.length - 1]?.link);
      }
    } else if (contentBaseUrl) {
      router.back();
    } else {
      // Handle tab parameter when going back
      let backUrl = activeLink ? activeLink : "/content";
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const tabParam = searchParams.get("tab");
        if (tabParam) {
          backUrl += `?tab=${tabParam}`;
        }
      }
      router.push(backUrl);
    }
  };
  console.log("content", item);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
        px: { xs: 2 },
        pb: { xs: 1 },
        pt: { xs: 2, sm: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flex: { xs: 1, md: 15 },
          gap: 1,
          flexDirection: "column",
          width: isShowMoreContent ? "initial" : "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            aria-label="back"
            onClick={onBackClick}
            sx={{ width: "24px", height: "24px" }}
          >
            <ArrowBackIcon />
          </IconButton>
          <BreadCrumb breadCrumbs={breadCrumbs} isShowLastLink />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            // pb: 2,
          }}
        >
          <Typography
            variant="body8"
            component="h2"
            sx={{
              fontWeight: 700,
              // fontSize: '24px',
              // lineHeight: '44px',
            }}
          >
            {item?.content?.name ?? "-"}
          </Typography>
          {item?.content?.description && (
            <ExpandableText
              text={item?.content?.description}
              maxWords={60}
              maxLines={2}
              _text={{
                fontSize: { xs: "14px", sm: "16px", md: "18px" },
                lineHeight: { xs: "20px", sm: "22px", md: "26px" },
              }}
            />
          )}
        </Box>
        <PlayerBox
          isShowMoreContent={isShowMoreContent}
          userIdLocalstorageName={userIdLocalstorageName}
          item={item}
          identifier={identifier}
          courseId={courseId}
          unitId={unitId}
          {..._config?.player}
        />
      </Box>

      <Box
        sx={{
          display: isShowMoreContent ? "flex" : "none",
          flexDirection: "column",
          flex: { xs: 1, sm: 1, md: 9 },
        }}
      >
        <Typography
          variant="body5"
          component="h2"
          sx={{
            mb: 2,
            fontWeight: 500,
            // fontSize: '18px',
            // lineHeight: '24px',
          }}
        >
          {t("LEARNER_APP.PLAYER.MORE_RELATED_RESOURCES")}
        </Typography>

        <CourseUnitDetails
          isShowLayout={false}
          isHideInfoCard={true}
          _box={{
            pt: 1,
            pb: 1,
            px: { md: 1 },
            height: "calc(100vh - 185px)",
          }}
          _config={{
            ...(_config?.courseUnitDetails || {}),
            getContentData: (item: any) => {
              setIsShowMoreContent(
                (item?.children || []).filter(
                  (child: any) => child.identifier !== identifier
                )?.length > 0
              );
            },
            _parentGrid: { pb: 2 },
            default_img: "/images/image_ver.png",
            _grid: { xs: 6, sm: 4, md: 6, lg: 6, xl: 6 },
            _card: {
              isHideProgress: true,
              ...(_config?.courseUnitDetails?._card || {}),
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default App;

const PlayerBox = ({
  item,
  identifier,
  courseId,
  unitId,
  userIdLocalstorageName,
  isGenerateCertificate,
  trackable,
  isShowMoreContent,
}: {
  item: any;
  identifier: string | string[] | undefined;
  courseId: string | string[] | undefined;
  unitId: string | string[] | undefined;
  userIdLocalstorageName?: string;
  isGenerateCertificate?: boolean;
  trackable?: boolean;
  isShowMoreContent: boolean;
}) => {
  // Use identifier as fallback for courseId and unitId when they're not provided
  const finalCourseId = courseId || identifier;
  const finalUnitId = unitId || identifier;
  const router = useRouter();
  const { t } = useTranslation();
  const [play, setPlay] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (checkAuth() || userIdLocalstorageName) {
      setPlay(true);
    }
  }, []);

  const handlePlay = () => {
    if (checkAuth() || userIdLocalstorageName) {
      setPlay(true);
    } else {
      router.push(
        `/login?redirectUrl=${
          courseId ? `/content-details/${courseId}` : `/player/${identifier}`
        }`
      );
    }
  };
  // Create proper player configuration
  const playerConfig = item?.content ? {
    context: {
      contentId: identifier,
      mode: "play",
      pdata: {
        id: "learner-web-app",
        ver: "1.0.0",
        pid: "learner-app"
      },
      uid: userIdLocalstorageName ? localStorage.getItem(userIdLocalstorageName) : "guest",
      channel: "learner-channel",
      sid: "",
      did: "",
      timeDiff: 0,
      host: "",
      endpoint: "/v1/telemetry",
      tags: [],
      partner: [],
      userData: {
        firstName: "Guest",
        lastName: ""
      },
      userName: "",
      accToken: "",
      tenantCode: "",
      tenantId: "",
      contextRollup: { l1: '' },
      objectRollup: {}
    },
    config: {
      showEndPage: false,
      endPage: [],
      showStartPage: true,
      host: "",
      overlay: {
        showUser: false,
        showOverlay: false
      },
      plugins: [],
      sideMenu: {
        showShare: false,
        showDownload: false,
        showReplay: false,
        showExit: false
      }
    },
    data: {},
    metadata: item.content
  } : null;


  
  // Debug the iframe URL construction
  // Get userId from localStorage
  const currentUserId = localStorage.getItem("userId");
  
  // Set userId in cookies for cross-port access
  if (currentUserId) {
    const domain = window.location.hostname;
    const cookieValue = `userId=${currentUserId}; path=/; domain=${domain}; SameSite=Lax; Secure=false`;
    document.cookie = cookieValue;
    
    // Also try setting without domain restriction
    const cookieValueNoDomain = `userId=${currentUserId}; path=/; SameSite=Lax; Secure=false`;
    document.cookie = cookieValueNoDomain;
  } else {
    console.warn("🍪 No userId found in localStorage to set in cookies");
  }

  // Add postMessage listener for cross-port communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'REQUEST_USER_ID') {
        const userId = localStorage.getItem("userId");
        if (userId) {
          // Send userId back to the player iframe
          const iframe = document.querySelector('iframe[name*="isGenerateCertificate"]') as HTMLIFrameElement;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'USER_ID_RESPONSE',
              userId: userId
            }, '*');
            console.log("🔍 Sent userId to player iframe:", userId);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  const iframeUrl = `${
    process.env.NEXT_PUBLIC_LEARNER_SBPLAYER || "http://localhost:3000/sbplayer"
  }?identifier=${identifier}${
    finalCourseId ? `&courseId=${finalCourseId}` : ""
  }${
    finalUnitId ? `&unitId=${finalUnitId}` : ""
  }${
    currentUserId ? `&userId=${currentUserId}` : ""
  }&player-config=${encodeURIComponent(JSON.stringify(playerConfig))}&_t=${Date.now()}&_v=${Math.random()}&_cache=${Math.random()}&_force=${Math.random()}&_reload=${Math.random()}`;
  
  console.log("🔧 Player parameters:", {
    identifier,
    courseId,
    unitId,
    finalCourseId,
    finalUnitId,
    currentUserId,
    playerConfig: !!playerConfig
  });
  console.log("🔧 Constructed iframe URL:", iframeUrl);
  
 
  return (
    <Box
      sx={{
        flex: { xs: 1, sm: 1, md: 8 },
        position: "relative",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {!play && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          <Avatar
            src={transformImageUrl(item?.posterImage || item?.appIcon) || `/images/image_ver.png`}
            alt={item?.identifier}
            style={{
              height: "calc(100vh - 235px)",
              width: "100%",
              borderRadius: 0,
            }}
          />
          <Button
            variant="contained"
            onClick={handlePlay}
            sx={{
              mt: 2,
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {t("Play")}
          </Button>
        </Box>
      )}

      {play && (
        <Box
          sx={{
            width: isShowMoreContent
              ? "100%"
              : { xs: "100%", sm: "100%", md: "90%", lg: "80%", xl: "70%" },
          }}
        >
          <iframe
            ref={iframeRef}
            name={JSON.stringify({
              isGenerateCertificate: isGenerateCertificate,
              trackable: trackable,
            })}
            src={iframeUrl}
            style={{
              border: "none",
              objectFit: "contain",
              aspectRatio: "16 / 9",
            }}
            allowFullScreen
            width="100%"
            height="100%"
            title="Sunbird Content Player"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            frameBorder="0"
            scrolling="no"
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups"
            onError={(e) => {
              console.error("Player iframe error:", e);
            }}
            onLoad={() => {
              console.log("Player iframe loaded successfully");
            }}
          />
        </Box>
      )}
    </Box>
  );
};
