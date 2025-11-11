import React, { memo } from "react";
import { Box, Grid, Typography, Button, CircularProgress } from "@mui/material";
import { ContentItem, useTranslation } from "@shared-lib";
import ContentCard from "./ContentCard";
import { ContentSearchResponse } from "@content-mfes/services/Search";


interface ContentCardGridProps {
 contentData: ContentSearchResponse[];
 _config: any;
 type: string;
 handleCardClick: (content: ContentItem, e?: any) => void;
 trackData?: any[];
 hasMoreData: boolean;
 handleLoadMore: (e: any) => void;
 isLoadingMoreData: boolean;
 isHideEmptyDataMessage?: boolean;
}


const ContentCardGrid = memo((props: ContentCardGridProps) => {
 const { t } = useTranslation();
 const { default_img, _subBox, _grid, _containerGrid, _card } =
   props._config ?? {};


 return (
   <Box {..._subBox} sx={{ ...(_subBox?.sx ?? {}) }}>
     {/* Spacing: 24-32px between cards (using 3 = 24px, 4 = 32px) */}
     <Grid container spacing={{ xs: 3, sm: 3, md: 4 }} {..._containerGrid}>
       {props.contentData?.map((item: any, index: number) => (
         <Grid
           key={`${item?.identifier}-${index}`}
           id={item?.identifier}
           item
           xs={6}
           sm={6}
           md={3}
           lg={3}
           xl={3}
           {..._grid}
         >
           <ContentCard
             item={item}
             type={props.type}
             default_img={default_img}
             _card={_card}
             handleCardClick={props.handleCardClick}
             trackData={props.trackData as [] | undefined}
           />
         </Grid>
       ))}
     </Grid>
     <Box sx={{ textAlign: "center", mt: 2 }}>
       {props.hasMoreData && (
         <Button
           variant="outlined"
           onClick={props.handleLoadMore}
           disabled={props.isLoadingMoreData}
           sx={{
             opacity: 0.7,
             fontSize: "12px",
             py: 1,
             px: 2
           }}
         >
           {props.isLoadingMoreData ? (
             <CircularProgress size={16} />
           ) : (
             t("LEARNER_APP.CONTENT_TABS.LOAD_MORE")
           )}
         </Button>
       )}
     </Box>
     {!props.contentData?.length && !props.isHideEmptyDataMessage && (
       <Typography
         variant="body1"
         sx={{
           minHeight: "100px",
           display: "flex",
           justifyContent: "center",
           alignItems: "center",
         }}
       >
         {t("LEARNER_APP.CONTENT_TABS.NO_MORE_DATA")}
       </Typography>
     )}
   </Box>
 );
});


ContentCardGrid.displayName = "ContentCardGrid";


export default ContentCardGrid;





