'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Description,
} from '@mui/icons-material';
import { CommonCard } from '@shared-lib';
import { getGroupContentDetails } from '@learner/utils/API/GroupService';
import { trackingData } from '@content-mfes/services/TrackingService';
import { calculateTrackDataItem } from '@shared-lib';

interface GroupContentItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'course';
  duration?: string;
  progress?: number;
  imageUrl?: string;
  isCompleted?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface GroupContentProps {
  groupId: string;
  groupName: string;
  onBack: () => void;
  onContentClick?: (content: GroupContentItem) => void;
  isLoading?: boolean;
}

const GroupContent: React.FC<GroupContentProps> = ({
  groupId,
  groupName,
  onBack,
  onContentClick,
  isLoading = false,
}) => {
  const [content, setContent] = useState<GroupContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackData, setTrackData] = useState<Record<string, unknown>[]>([]);

  // Fetch group content from API using composite search
  useEffect(() => {
    const fetchGroupContent = async () => {
      setLoading(true);
      try {
        const contentDetails = await getGroupContentDetails(groupId);
        console.log('Content details from composite search:', contentDetails);
        
        // Transform API response to match our interface
        const transformedContent = contentDetails.map((item: Record<string, unknown>) => ({
          id: String(item.identifier || item.id || ''),
          title: String(item.name || item.title || 'Untitled Content'),
          description: String(item.description || item.summary || ''),
          type: (item.mimeType === 'application/vnd.ekstep.content-collection' ? 'course' : 
                 item.mimeType === 'application/vnd.ekstep.ecml-archive' ? 'video' :
                 item.mimeType === 'application/vnd.sunbird.questionset' ? 'quiz' :
                 'document') as 'video' | 'document' | 'quiz' | 'assignment' | 'course',
          duration: String(item.duration || item.timeLimit || ''),
          progress: Number(item.progress || item.completionPercentage || 0),
          isCompleted: item.status === 'completed' || item.progress === 100,
          difficulty: (item.difficulty === 'intermediate' ? 'intermediate' :
                     item.difficulty === 'advanced' ? 'advanced' : 'beginner') as 'beginner' | 'intermediate' | 'advanced',
          imageUrl: String(item.posterImage || item.appIcon || ''),
        }));
        setContent(transformedContent);
        console.log('Transformed content:', transformedContent);
        console.log('Content count:', transformedContent.length);

        // Fetch TrackData for enrollment status (same logic as content MFE)
        if (transformedContent.length > 0) {
          try {
            // Use consistent user ID logic like content MFE
            const getUserId = (userIdLocalstorageName?: string) => {
              const key = userIdLocalstorageName || 'userId';
              return localStorage.getItem(key) || '';
            };
            
            const userId = getUserId('userId');
            if (userId) {
              const userIdArray = userId.split(',').filter(Boolean);
              const courseIds = transformedContent.map(item => item.id);
              
              // Fetch both tracking data and certificates (same as content MFE)
              const [trackDataResponse, certificates] = await Promise.all([
                trackingData(userIdArray, courseIds),
                // Note: getUserCertificates would need to be imported if available
                // For now, we'll use a simplified approach
                Promise.resolve({ result: { data: [] } })
              ]);
              
              if (trackDataResponse?.data) {
                const userTrackData = trackDataResponse.data.find((course: Record<string, unknown>) => course.userId === userId)?.course ?? [];
                
                const processedTrackData = userTrackData.map((item: Record<string, unknown>) => {
                  const contentItem = transformedContent.find(contentItem => contentItem.id === item.courseId);
                  const calculatedData = calculateTrackDataItem(item, contentItem ?? {});
                  
                  return {
                    ...calculatedData,
                    courseId: item.courseId,
                    completed: item.completed || false,
                    completed_list: item.completed_list || [],
                    status: item.status || 'not started',
                    enrolled: Boolean(
                      (certificates.result.data as Record<string, unknown>[]).find(
                        (cert: Record<string, unknown>) => cert.courseId === item.courseId
                      )?.status === "enrolled"
                    ),
                  };
                });
                setTrackData(processedTrackData);
                console.log('TrackData fetched (Groups):', processedTrackData);
                console.log('TrackData structure (Groups):', processedTrackData.map((track: Record<string, unknown>) => ({
                  courseId: track.courseId,
                  completed: track.completed,
                  completed_list: track.completed_list,
                  status: track.status,
                  enrolled: track.enrolled
                })));
                console.log('Content IDs for matching (Groups):', transformedContent.map(item => item.id));
              }
            }
          } catch (trackError) {
            console.error('Error fetching TrackData (Groups):', trackError);
            setTrackData([]);
          }
        }
      } catch (error) {
        console.error('Error fetching group content:', error);
        // Fallback to empty array on error
        setContent([]);
        setTrackData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupContent();
  }, [groupId]);

  const handleContentClick = (contentItem: GroupContentItem) => {
    if (onContentClick) {
      // Transform the content item to match the expected structure
      const transformedContent = {
        ...contentItem,
        mimeType: contentItem.type === 'video' ? 'application/vnd.ekstep.video' :
                  contentItem.type === 'document' ? 'application/vnd.ekstep.html-archive' :
                  contentItem.type === 'quiz' ? 'application/vnd.sunbird.questionset' :
                  contentItem.type === 'course' ? 'application/vnd.ekstep.content-collection' :
                  contentItem.type === 'assignment' ? 'application/vnd.ekstep.html-archive' :
                  'application/vnd.ekstep.html-archive',
        identifier: contentItem.id,
        name: contentItem.title,
        posterImage: contentItem.imageUrl,
      };
      onContentClick(transformedContent);
    }
  };



  if (loading || isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '300px',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading group content...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body2"
          onClick={onBack}
          sx={{
            textDecoration: 'none',
            color: 'primary.main',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          Groups
        </Link>
        <Typography variant="body2" color="text.primary">
          {groupName}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#1F1B13',
              mb: 1,
            }}
          >
            {groupName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {content.length} content items available
          </Typography>
          {/* Debug info - remove in production */}
    
        </Box>
      </Box>

      {content.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Description sx={{ fontSize: 64, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            No content available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Content will appear here once it&apos;s added to this group
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 1, sm: 1, md: 2 }}>
          {content.map((item) => (
            <Grid
              item
              xs={6}
              sm={6}
              md={4}
              lg={3}
              xl={2.4}
              key={item.id}
            >
              <CommonCard
                title={item.title}
                image={item.imageUrl || ''}
                content={null}
                actions={null}
                orientation="horizontal"
                item={{
                  identifier: item.id,
                  name: item.title,
                  mimeType: item.type,
                  posterImage: item.imageUrl || '',
                  description: item.description,
                  gradeLevel: [],
                  language: [],
                  artifactUrl: '',
                  appIcon: '',
                  contentType: item.type,
                }}
                type={item.type}
                TrackData={trackData}
                onClick={() => handleContentClick(item)}
                _card={{
                  _contentParentText: {
                    sx: { height: item.type !== "course" ? "50px" : "60px" },
                  },
                  sx: {
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  },
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default GroupContent;


