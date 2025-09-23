import React, { useRef, useEffect, useState } from "react";
import { getTelemetryEvents } from "../../services/TelemetryService";
import { useParams } from "next/navigation";

interface PlayerProps {
  playerConfig: any;
  relatedData?: any;
  configFunctionality?: boolean;
}

const iframeREcml = useParams();

const basePath = process.env.NEXT_PUBLIC_ASSETS_CONTENT || "/sbplayer";

// Function to extract YouTube video ID from URL
const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  // Enhanced regex to handle more YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }
  
  return null;
};

const V1Player = ({
  playerConfig,
  relatedData: { courseId, unitId, userId },
  configFunctionality,
}: PlayerProps) => {
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const [loadingError, setLoadingError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  console.log("V1Player Component is rendering!");
  console.log("Initial playerConfig received:", playerConfig);
  console.log("V1Player metadata:", playerConfig?.metadata);
  console.log("V1Player artifactUrl:", playerConfig?.metadata?.artifactUrl);
  console.log("V1Player streamingUrl:", playerConfig?.metadata?.streamingUrl);
  
  // Check if this is YouTube content
  const isYouTubeContent = playerConfig?.metadata?.mimeType === 'video/x-youtube' || 
                          playerConfig?.metadata?.mimeType === 'video/youtube';
  
  // Try to extract video ID from artifactUrl first, then streamingUrl as fallback
  const artifactUrl = playerConfig?.metadata?.artifactUrl;
  const streamingUrl = playerConfig?.metadata?.streamingUrl;
  
  let youtubeVideoId = null;
  if (isYouTubeContent && artifactUrl) {
    youtubeVideoId = extractYouTubeVideoId(artifactUrl);
    console.log("V1Player: Tried artifactUrl:", artifactUrl, "-> ID:", youtubeVideoId);
  }
  
  if (!youtubeVideoId && isYouTubeContent && streamingUrl) {
    youtubeVideoId = extractYouTubeVideoId(streamingUrl);
    console.log("V1Player: Tried streamingUrl:", streamingUrl, "-> ID:", youtubeVideoId);
  }

  console.log("Is YouTube content:", isYouTubeContent);
  console.log("YouTube video ID:", youtubeVideoId);
  
  useEffect(() => {
    const preview: any = previewRef.current;
    console.log("V1Player useEffect triggered.");
    console.log("V1Player playerConfig on useEffect:", playerConfig);

    if (preview) {
      // For YouTube content, don't reset the src since it's already correct
      if (!isYouTubeContent) {
        const originalSrc = preview.src;
        preview.src = "";
        preview.src = originalSrc;
        console.log("V1Player iframe src reset and reloaded for non-YouTube content.");
      }

      const handleLoad = () => {
        console.log("V1Player iframe loaded event triggered.");
        setLoadingError(false);

        // For YouTube content, we don't need to call initializePreview
        if (isYouTubeContent && youtubeVideoId) {
          console.log("YouTube content loaded successfully with video ID:", youtubeVideoId);
          return; // Exit early for YouTube content
        }

        // Regular V1Player handling for non-YouTube content
        if (preview.contentWindow) {
          console.log("V1Player contentWindow available.");
          
          setTimeout(() => {
            if (typeof preview.contentWindow.initializePreview === "function") {
              console.log(
                "V1Player initializePreview function found. Calling it with:",
                playerConfig
              );

              try {
                preview.contentWindow.initializePreview(playerConfig);
                console.log("V1Player initializePreview called successfully.");
              } catch (error) {
                console.error("V1Player initializePreview error:", error);
                setLoadingError(true);
              }
            } else {
              console.warn(
                "V1Player: initializePreview function not found in iframe contentWindow."
              );
              if (retryCount < 2) {
                console.log("Retrying iframe load...");
                setRetryCount(prev => prev + 1);
                preview.src = preview.src;
              } else {
                setLoadingError(true);
              }
            }
          }, 1000);
        } else {
          console.warn("V1Player: iframe contentWindow is null or undefined.");
          setLoadingError(true);
        }

        // Add error event listener for iframe
        preview.addEventListener("error", (event: Event) => {
          console.error("V1Player iframe error:", event);
          setLoadingError(true);
        });

        preview.addEventListener(
          "renderer:telemetry:event",
          async (event: any) => {
            console.log("V1 player telemetry event ===>", event);
            if (event.detail.telemetryData.eid === "START") {
              console.log("V1 player telemetry START event ===>", event);
            }
            if (event.detail.telemetryData.eid === "END") {
              console.log("V1 player telemetry END event ===>", event);
            }

            try {
              await getTelemetryEvents(event.detail.telemetryData, "v1", {
                courseId,
                unitId,
                userId,
                configFunctionality,
              });
            } catch (error) {
              console.error("Telemetry error:", error);
            }
          }
        );
      };

      preview.addEventListener("load", handleLoad);

      return () => {
        console.log("V1Player useEffect cleanup.");
        preview.removeEventListener("load", handleLoad);
      };
    } else {
      console.warn("V1Player: previewRef.current is null.");
    }
  }, [playerConfig, courseId, unitId, userId, configFunctionality, retryCount, isYouTubeContent, youtubeVideoId]);

  const handleRetry = () => {
    setLoadingError(false);
    setRetryCount(0);
    if (previewRef.current) {
      previewRef.current.src = previewRef.current.src;
    }
  };

  if (loadingError) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3>Player Loading Error</h3>
        <p>There was an issue loading the content player. This might be due to:</p>
        <ul style={{ textAlign: 'left', maxWidth: '400px' }}>
          <li>Network connectivity issues</li>
          <li>YouTube API loading problems</li>
          <li>Content availability issues</li>
          <li>CORS policy restrictions</li>
        </ul>
        <button 
          onClick={handleRetry}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Retry Loading
        </button>
        <details style={{ marginTop: '20px', textAlign: 'left' }}>
          <summary>Debug Information</summary>
          <pre style={{ fontSize: '12px', marginTop: '10px' }}>
            {JSON.stringify({
              playerConfig: playerConfig?.metadata,
              basePath,
              retryCount,
              isYouTubeContent,
              youtubeVideoId,
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  // For YouTube content, use a different iframe source
  const iframeSrc = isYouTubeContent && youtubeVideoId 
    ? `${basePath}/libs/sunbird-content-player/preview/youtube.html?id=${youtubeVideoId}&origin=${encodeURIComponent(window.location.origin)}`
    : `${basePath}/content/preview/preview.html?webview=true`;

  console.log("V1Player: Final iframe src:", iframeSrc);
  console.log("V1Player: basePath:", basePath);
  console.log("V1Player: window.location.origin:", window.location.origin);

  return (
    <>
      <iframe
        ref={previewRef}
        id="contentPlayer"
        title="Content Player"
        src={iframeSrc}
        aria-label="Content Player"
        style={{ border: "none" }}
        width={"100%"}
        height={"100%"}
        onLoad={() => {
          console.log("V1Player: iframe loaded successfully with src:", iframeSrc);
        }}
        onError={(e) => {
          console.error("V1Player: iframe error:", e);
          console.error("V1Player: Failed to load iframe src:", iframeSrc);
        }}
      ></iframe>
    </>
  );
};

export default V1Player;
