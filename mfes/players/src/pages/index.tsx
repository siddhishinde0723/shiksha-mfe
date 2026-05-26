import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  fetchContent,
  getHierarchy,
  getQumlData,
} from "../services/PlayerService";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { MIME_TYPE } from "../utils/url.config";
import {
  PlayerConfig,
  V1PlayerConfig,
  V2PlayerConfig,
} from "../utils/url.config";
import Loader from "../components/Loader";
import { offlineService } from "@shared-lib-v2/utils/OfflineService";

const SunbirdPlayers = dynamic(() => import("../components/players/Players"), {
  ssr: false,
});

interface SunbirdPlayerProps {
  identifier?: string; // Allow identifier as a prop
  playerConfig?: PlayerConfig; // Optional playerConfig prop
}

const Players: React.FC<SunbirdPlayerProps> = ({
  identifier: propIdentifier,
  playerConfig: propPlayerConfig,
}) => {
  const router = useRouter();
  const { courseId, unitId, identifier: queryIdentifier } = router.query ?? {}; // Get identifier from the query
  const identifier = propIdentifier || queryIdentifier; // Prefer prop over query
  const [playerConfig, setPlayerConfig] = useState<PlayerConfig | undefined>(
    propPlayerConfig
  );
  const [loading, setLoading] = useState(!propPlayerConfig);
  const [isGenerateCertificate, setIsGenerateCertificate] = useState(true);
  const [trackable, setTrackable] = useState(true);
  const [userId, setUserId] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Get all query params once router is ready
  useEffect(() => {
    if (router.isReady) {
     
      const queryUserId = router.query.userId as string;
      const queryTenantId = router.query.tenantId as string;
     
      
      if (queryUserId) {
        setUserId(queryUserId);
      } else {
        // Fallback to other sources if not in query params
        const storedUserId = localStorage.getItem("userId") || "";
        setUserId(storedUserId);
      }

      // Handle tenantId from URL parameters
      if (queryTenantId) {
        localStorage.setItem("tenantId", queryTenantId);
      } else {
        // Check if tenantId already exists in localStorage
        const storedTenantId = localStorage.getItem("tenantId");
        if (!storedTenantId) {
          console.warn("❌ No tenantId found in URL parameters or localStorage!");
        }
      }

      // Check if already downloaded
      if (identifier) {
        offlineService.getStoredMetadata(identifier.toString()).then(stored => {
          if (stored) setIsDownloaded(true);
        });
      }
    }
  }, [router.isReady, router.query.userId, router.query.tenantId, identifier]);

  const handleDownload = async () => {
    if (!identifier || !playerConfig) return;
    setIsDownloading(true);
    try {
      console.log("[Player] Starting download...");
      
      // 1. Save metadata and hierarchy
      await offlineService.downloadContentMetadata(
        identifier.toString(), 
        playerConfig.metadata, 
        playerConfig.metadata // In this player, hierarchy is often merged into metadata
      );

      // 2. Identify and download assets
      const assetsToDownload: string[] = [];
      const metadata: any = playerConfig.metadata || {};

      // Add main content URL
      if (metadata.artifactUrl) assetsToDownload.push(metadata.artifactUrl);
      if (metadata.streamingUrl) assetsToDownload.push(metadata.streamingUrl);
      if (metadata.appIcon) assetsToDownload.push(metadata.appIcon);
      if (metadata.posterImage) assetsToDownload.push(metadata.posterImage);

      console.log(`[Player] Downloading ${assetsToDownload.length} assets...`);
      for (const url of assetsToDownload) {
        await offlineService.downloadAsset(url);
      }

      setIsDownloaded(true);
      console.log("[Player] Download complete!");
    } catch (error) {
      console.error("[Player] Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };
  useEffect(() => {
    if (playerConfig || !identifier) return;

    const loadContent = async () => {
      setLoading(true);
      try {
        const name = window.name;
        const jsonParse = name ? JSON.parse(name) : {};
        setIsGenerateCertificate(jsonParse.generateCertificate ?? true);
        setTrackable(jsonParse.trackable ?? true);
        const data = await fetchContent(identifier);
        let config: PlayerConfig;

        if (data.mimeType === MIME_TYPE.QUESTION_SET_MIME_TYPE) {
          config = { ...V2PlayerConfig };
          const Q1 = await getHierarchy(identifier);
          const Q2 = await getQumlData(identifier);
          const metadata = { ...Q1?.questionset, ...Q2?.questionset };
          config.metadata = metadata;
        } else if (MIME_TYPE.INTERACTIVE_MIME_TYPE.includes(data?.mimeType)) {
          config = { ...V1PlayerConfig, metadata: data, data: data.body || {} };
          //@ts-ignore
          config.context["contentId"] = identifier;
        } else {
          config = { ...V2PlayerConfig, metadata: data };
          //@ts-ignore
          config.context["contentId"] = identifier;
        }

        setPlayerConfig(config);
      } catch (error) {
        console.error("Error loading content:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [identifier, playerConfig]);

  if (!identifier) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography color="error">No identifier provided</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100vh"
        >
          <Loader showBackdrop={false} />
        </Box>
      ) : (
        <Box sx={{ height: "calc(100vh - 16px)", display: "flex", flexDirection: "column" }}>
          <Box display="flex" justifyContent="flex-end" p={1} sx={{ backgroundColor: 'white' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={isDownloaded ? <CheckCircleIcon /> : (isDownloading ? <CircularProgress size={20} /> : <DownloadIcon />)}
              onClick={handleDownload}
              disabled={isDownloading || isDownloaded}
              color={isDownloaded ? "success" : "primary"}
              sx={{ textTransform: 'none' }}
            >
              {isDownloaded ? "Downloaded" : (isDownloading ? "Downloading..." : "Download Offline")}
            </Button>
          </Box>
          <Box flex={1}>
            <SunbirdPlayers
              player-config={playerConfig}
              courseId={courseId as string}
              unitId={unitId as string}
              userId={userId as string}
              configFunctionality={{ isGenerateCertificate, trackable }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Players;
