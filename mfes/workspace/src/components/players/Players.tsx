import React from "react";
import SunbirdPdfPlayer from "@workspace/components/players/SunbirdPdfPlayer";
import SunbirdVideoPlayer from "@workspace/components/players/SunbirdVideoPlayer";
import SunbirdEpubPlayer from "@workspace/components/players/SunbirdEpubPlayer";
import SunbirdQuMLPlayer from "@workspace/components/players/SunbirdQuMLPlayer";
import SunbirdV1Player from "@workspace/components/V1-Player/V1Player";
import YouTubePlayer from "@workspace/components/players/YouTubePlayer";

interface PlayerProps {
  playerConfig: any;
}

const Players = ({ playerConfig }: PlayerProps) => {
  const mimeType = playerConfig?.metadata?.mimeType;
  
  console.log("🔥🔥🔥 WORKSPACE COMPONENTS/PLAYERS DEBUG 🔥🔥🔥");
  console.log("Timestamp:", new Date().toISOString());
  console.log("File: mfes/workspace/src/components/players/Players.tsx");
  console.log("This is the UPDATED Players.tsx file with YouTube support!");
  console.log("🚀🚀🚀 FORCE RELOAD TEST - THIS SHOULD APPEAR IN CONSOLE 🚀🚀🚀");
  console.log("🎯🎯🎯 WORKSPACE COMPONENTS PLAYER LOADED - NEW VERSION 🎯🎯🎯");
  console.log("🎯🎯🎯 IF YOU SEE THIS, THE NEW CODE IS WORKING 🎯🎯🎯");
  console.log("🎯🎯🎯 WORKSPACE COMPONENTS CACHE BUST TEST 🎯🎯🎯");
  console.log("🎯🎯🎯 THIS SHOULD APPEAR AFTER CACHE CLEAR 🎯🎯🎯");
  console.log("mimeType:", mimeType);
  console.log("playerConfig:", playerConfig);

  // Check for YouTube content with multiple possible mimeType formats
  const isYouTubeContent = mimeType === "video/x-youtube" || 
                          mimeType === "video/youtube" ||
                          (typeof mimeType === 'string' && mimeType.includes('youtube'));

  console.log("- isYouTubeContent check result:", isYouTubeContent);

  if (isYouTubeContent) {
    console.log("🎯 WORKSPACE COMPONENTS: Routing to YouTube Player");
    console.log("🎯 WORKSPACE COMPONENTS: YouTube case matched! mimeType:", mimeType);
    return <YouTubePlayer playerConfig={playerConfig} />;
  }

  switch (mimeType) {
    case "application/pdf":
      console.log("Workspace Components: Routing to PDF Player");
      return <SunbirdPdfPlayer playerConfig={playerConfig} />;
    case "video/webm":
      console.log("Workspace Components: Routing to Video Player");
      return <SunbirdVideoPlayer playerConfig={playerConfig} />;
    case "video/mp4":
    case 'audio/mp3':
    case 'audio/wav':
      console.log("Workspace Components: Routing to Video Player");
      return <SunbirdVideoPlayer playerConfig={playerConfig} />;
    case "application/vnd.sunbird.questionset":
      console.log("Workspace Components: Routing to QuML Player");
      return <SunbirdQuMLPlayer playerConfig={playerConfig} />;
    case "application/epub":
      console.log("Workspace Components: Routing to EPUB Player");
      return <SunbirdEpubPlayer playerConfig={playerConfig} />;
    case "application/vnd.ekstep.h5p-archive":
    case "application/vnd.ekstep.html-archive":
      console.log("Workspace Components: Routing to V1 Player");
      return <SunbirdV1Player playerConfig={playerConfig} />;
    default:
      console.log("Workspace Components: No matching player found, showing unsupported message");
      return <div>Unsupported media type: {mimeType}</div>;
  }
};

export default Players;
