import React, { useRef, useEffect, useState } from "react";
import { getTelemetryEvents } from "../../services/TelemetryService";

interface YouTubePlayerProps {
  playerConfig: any;
  relatedData?: any;
  configFunctionality?: boolean;
}

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

const YouTubePlayer = ({
  playerConfig,
  relatedData: { courseId, unitId, userId },
  configFunctionality,
}: YouTubePlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loadingError, setLoadingError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  console.log("🎯🎯🎯 PLAYERS MFE YOUTUBE PLAYER LOADED 🎯🎯🎯");
  console.log("🎯🎯🎯 IF YOU SEE THIS, THE PLAYERS MFE YOUTUBE PLAYER IS WORKING 🎯🎯🎯");
  console.log("YouTubePlayer Component is rendering!");
  console.log("YouTube playerConfig:", playerConfig);
  
  // Try to extract video ID from artifactUrl first, then streamingUrl as fallback
  const artifactUrl = playerConfig?.metadata?.artifactUrl;
  const streamingUrl = playerConfig?.metadata?.streamingUrl;
  
  let youtubeVideoId = null;
  if (artifactUrl) {
    youtubeVideoId = extractYouTubeVideoId(artifactUrl);
    console.log("YouTubePlayer: Tried artifactUrl:", artifactUrl, "-> ID:", youtubeVideoId);
  }
  
  if (!youtubeVideoId && streamingUrl) {
    youtubeVideoId = extractYouTubeVideoId(streamingUrl);
    console.log("YouTubePlayer: Tried streamingUrl:", streamingUrl, "-> ID:", youtubeVideoId);
  }

  console.log("Extracted YouTube video ID:", youtubeVideoId);
  
  useEffect(() => {
    const iframe = iframeRef.current;
    
    if (iframe && youtubeVideoId) {
      // Set a timeout to detect if iframe doesn't load within 30 seconds
      const timeout = setTimeout(() => {
        if (!isPlayerReady) {
          console.warn("YouTube iframe loading timeout - may be blank screen issue");
          // Only set error after multiple attempts
          if (retryCount > 1) {
            setLoadingError(true);
          }
          setIsLoading(false);
        }
      }, 30000);
      setTimeoutId(timeout);

      const handleLoad = () => {
        console.log("YouTube iframe loaded successfully");
        setLoadingError(false);
        setIsPlayerReady(true);
        setIsLoading(false);
        if (timeout) {
          clearTimeout(timeout);
        }
      };

      const handleError = () => {
        console.error("YouTube iframe failed to load");
        // Only set error after multiple attempts
        if (retryCount > 1) {
          setLoadingError(true);
        }
        setIsPlayerReady(false);
        setIsLoading(false);
        if (timeout) {
          clearTimeout(timeout);
        }
      };

      // Additional check for iframe content
      const checkIframeContent = () => {
        try {
          // Try to access iframe content to detect blank screen
          if (iframe.contentDocument && iframe.contentDocument.body) {
            const bodyText = iframe.contentDocument.body.innerText;
            if (bodyText.includes('An error occurred') || bodyText.includes('Video unavailable')) {
              console.warn("YouTube iframe shows error content");
              setLoadingError(true);
              setIsLoading(false);
            }
          }
        } catch (e) {
          // Cross-origin access denied - this is normal for YouTube embeds
          console.log("Cannot access iframe content (cross-origin) - this is normal");
        }
      };

      iframe.addEventListener("load", handleLoad);
      iframe.addEventListener("error", handleError);
      
      // Check content after a delay
      setTimeout(checkIframeContent, 3000);

      return () => {
        iframe.removeEventListener("load", handleLoad);
        iframe.removeEventListener("error", handleError);
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [youtubeVideoId, isPlayerReady]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      console.log("YouTubePlayer component unmounting, cleaning up");
      setIsPlayerReady(false);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const handleRetry = () => {
    setLoadingError(false);
    setIsLoading(true);
    setIsPlayerReady(false);
    setRetryCount(prev => prev + 1);
    if (iframeRef.current) {
      // Force reload by changing src
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  };

  if (!youtubeVideoId) {
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
        <h3>Invalid YouTube Content</h3>
        <p>Unable to extract YouTube video ID from the provided URL.</p>
        <details style={{ marginTop: '20px', textAlign: 'left' }}>
          <summary>Debug Information</summary>
          <pre style={{ fontSize: '12px', marginTop: '10px' }}>
            {JSON.stringify({
              artifactUrl: playerConfig?.metadata?.artifactUrl,
              streamingUrl: playerConfig?.metadata?.streamingUrl,
              mimeType: playerConfig?.metadata?.mimeType,
              extractedVideoId: youtubeVideoId,
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  // Only show error UI if there's a persistent error after multiple retries
  if (loadingError && retryCount > 2) {
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
        <h3>Unable to Load YouTube Video</h3>
        <p>Please try refreshing the page or check your internet connection.</p>
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
          Try Again
        </button>
      </div>
    );
  }

  // Create YouTube embed URL with parameters optimized to prevent blank screen
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&modestbranding=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0&playsinline=1&showinfo=0&controls=1&disablekb=0&loop=0&mute=0&autoplay=0`;

  console.log("YouTube embed URL:", youtubeEmbedUrl);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#000' }}>
      {/* Loading indicator */}
      {isLoading && !loadingError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '10px' }}>Loading YouTube Player...</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Video ID: {youtubeVideoId}
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={youtubeEmbedUrl}
        title="YouTube Video Player"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px',
          backgroundColor: '#000'
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="eager"
        onLoad={() => {
          console.log("YouTube iframe loaded");
          setIsPlayerReady(true);
          setIsLoading(false);
        }}
        onError={() => {
          console.error("YouTube iframe error");
          // Only set error after multiple attempts
          if (retryCount > 1) {
            setLoadingError(true);
          }
          setIsLoading(false);
          setIsPlayerReady(false);
        }}
      />
    </div>
  );
};

export default YouTubePlayer;
