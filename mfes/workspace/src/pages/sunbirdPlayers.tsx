/* eslint-disable @nx/enforce-module-boundaries */
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

const SunbirdPdfPlayer = dynamic(
  () => import("@workspace/components/players/SunbirdPdfPlayer"),
  {
    ssr: false,
  }
);

const SunbirdVideoPlayer = dynamic(
  () => import("@workspace/components/players/SunbirdVideoPlayer"),
  {
    ssr: false,
  }
);
const SunbirdEpubPlayer = dynamic(
  () => import("@workspace/components/players/SunbirdEpubPlayer"),
  {
    ssr: false,
  }
);

const SunbirdQuMLPlayer = dynamic(
  () => import("@workspace/components/players/SunbirdQuMLPlayer"),
  {
    ssr: false,
  }
);

const SunbirdV1Player = dynamic(
  () => import("@workspace/components/V1-Player/V1Player"),
  {
    ssr: false,
  }
);

const YouTubePlayer = dynamic(
  () => import("@workspace/components/players/YouTubePlayer"),
  {
    ssr: false,
  }
);

interface PlayerProps {
  "player-config": any;
  identifier: string;
}

const SunbirdPlayers = () => {
  const router = useRouter();
  const [playerConfig, setPlayerConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const playerConfigParam = urlParams.get('player-config');
    
    if (playerConfigParam) {
      try {
        const parsedConfig = JSON.parse(decodeURIComponent(playerConfigParam));
        console.log("workspace playerconfig from URL", parsedConfig);
        setPlayerConfig(parsedConfig);
      } catch (error) {
        console.error("Error parsing player-config:", error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading player...</div>;
  }

  if (!playerConfig) {
    return <div>No player configuration found</div>;
  }


  
  const mimeType = playerConfig?.metadata?.mimeType;

  // Check for YouTube content with multiple possible mimeType formats
  const isYouTubeContent = mimeType === "video/x-youtube" || 
                          mimeType === "video/youtube" ||
                          (typeof mimeType === 'string' && mimeType.includes('youtube'));

  console.log("- isYouTubeContent check result:", isYouTubeContent);
  console.log("- mimeType === 'video/x-youtube':", mimeType === "video/x-youtube");
  console.log("- mimeType === 'video/youtube':", mimeType === "video/youtube");
  console.log("- mimeType.includes('youtube'):", typeof mimeType === 'string' && mimeType.includes('youtube'));

  if (isYouTubeContent) {
    console.log("🎯 WORKSPACE: Routing to YouTube Player");
    console.log("🎯 WORKSPACE: YouTube case matched! mimeType:", mimeType);
    return <YouTubePlayer playerConfig={playerConfig} />;
  }

  console.log("- About to switch on mimeType:", mimeType);
  
  switch (mimeType) {
    case "application/pdf":
      console.log("Workspace: Routing to PDF Player");
      return <SunbirdPdfPlayer playerConfig={playerConfig} />;
    case "video/mp4":
    case 'audio/mp3':
    case 'audio/wav':
      console.log("Workspace: Routing to Video Player");
      return <SunbirdVideoPlayer playerConfig={playerConfig} />;
    case "application/vnd.sunbird.questionset":
      console.log("Workspace: Routing to QuML Player");
      return <SunbirdQuMLPlayer playerConfig={playerConfig} />;
    case "application/epub":
      console.log("Workspace: Routing to EPUB Player");
      return <SunbirdEpubPlayer playerConfig={playerConfig} />;
    case "application/vnd.ekstep.h5p-archive":
    case "application/vnd.ekstep.html-archive":
      console.log("Workspace: Routing to V1 Player");
      console.log("Workspace: V1 Player case matched! mimeType:", mimeType);
      return <SunbirdV1Player playerConfig={playerConfig} />;
    default:
      console.log("Workspace: No matching player found, showing unsupported message");
      console.log("Workspace: Default case matched! mimeType:", mimeType);
      return <div>Unsupported media type: {mimeType}</div>;
  }
};

export default SunbirdPlayers;
