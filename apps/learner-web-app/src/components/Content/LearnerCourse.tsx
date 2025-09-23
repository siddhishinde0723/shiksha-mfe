import dynamic from "next/dynamic";
import React, { useState, useCallback, memo, useEffect } from "react";
import { Box, Button, Chip, Drawer, Stack, Typography, CircularProgress } from "@mui/material";
import { useTranslation } from "@shared-lib";
import {
  Close as CloseIcon,
  FilterAltOutlined,
  FilterList,
  Search,
} from "@mui/icons-material";
import SearchComponent from "./SearchComponent";
import FilterComponent from "./FilterComponent";
import { gredientStyle } from "@learner/utils/style";
import { logEvent } from "@learner/utils/googleAnalytics";

interface LearnerCourseProps {
  title?: string;
  activeTab?: string;
  isLoading?: boolean;
  _content?: any;
}

const Content = dynamic(() => import("@Content"), {
  ssr: false,
  loading: () => (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '200px',
      flexDirection: 'column',
      gap: 2
    }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Loading content...
      </Typography>
    </Box>
  ),
});

export default memo(function LearnerCourse({
  title,
  activeTab,
  isLoading,
  _content,
}: LearnerCourseProps) {
  const [filterState, setFilterState] = useState<any>({ limit: 10 });
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { staticFilter, filterFramework } = _content ?? {};
  useEffect(() => {
    setFilterState(_content?.filters ?? {});
  }, [_content?.filters, _content?.searchParams]);

  const handleTabChange = useCallback((tab: any) => {
    const type = tab === "Course" ? "Course" : "Learning Resource";
    setFilterState((prevState: any) => ({
      ...prevState,
      query: "",
      type,
    }));
  }, []);
  const handleSearchClick = useCallback(
    (searchValue: string) => {
      if (typeof window !== "undefined") {
        const windowUrl = window.location.pathname;
        const cleanedUrl = windowUrl;
        logEvent({
          action: "search content by " + searchValue,
          category: cleanedUrl,
          label: "Search content",
        });
      }
      const type =
        _content?.tab === "Course"
          ? "Course"
          : "Learning Resource";
      
      // Use functional update to prevent race conditions
      setFilterState((prevState: any) => {
        const newState = {
          ...prevState,
          query: searchValue,
          offset: 0,
          type,
        };
        
        // Only update if there's actually a change
        if (JSON.stringify(prevState) === JSON.stringify(newState)) {
          return prevState; // No change, return same object
        }
        
        return newState;
      });
    },
    [_content]
  );

  const handleFilterChange = (newFilterState: typeof filterState) => {
    setFilterState((prevState: any) => {
      const newState = {
        ...prevState,
        filters: newFilterState,
      };
      
      // Only update if there's actually a change
      if (JSON.stringify(prevState) === JSON.stringify(newState)) {
        return prevState; // No change, return same object
      }
      
      return newState;
    });
  };

  return (
    <Stack sx={{ gap: { xs: 0, sm: 0, md: 2 }, pb: 4 }}>
      {title && (
        <Box
          sx={{
            position: "sticky",
            top: 0,
            bgcolor: "",
            px: { xs: 1, md: 4 },
            py: { xs: 1, md: 2 },
            zIndex: 1,
          }}
          style={gredientStyle}
        >
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            sx={{
              gap: { xs: 2, md: 0 },
              px: { xs: 1, md: 0 },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                fontSize: "22px",
                lineHeight: "28px",
              }}
            >
              {t(title ?? "LEARNER_APP.COURSE.GET_STARTED")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box sx={{ display: { xs: "block", md: "none" } }}>
                <Button
                  variant="outlined"
                  onClick={() => setIsOpen(true)}
                  size="large"
                  sx={{
                    borderRadius: "8px",
                    borderWidth: "1px",
                    borderColor: "#DADADA !important",
                    padding: "8px 10px",
                  }}
                >
                  <FilterList sx={{ width: 20, height: 20, mr: 0.5 }} />
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.1px",
                      mr: 0.5,
                    }}
                  >
                    {t("LEARNER_APP.CONTENT.FILTERS")}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.1px",
                    }}
                  >
                    {Object.keys(filterState?.filters || {}).filter(
                      (e) =>
                        !["limit", ...Object.keys(staticFilter ?? {})].includes(
                          e
                        )
                    ).length
                      ? `(${
                          Object.keys(filterState.filters).filter(
                            (e) =>
                              ![
                                "limit",
                                ...Object.keys(staticFilter ?? {}),
                              ].includes(e)
                          ).length
                        })`
                      : null}
                  </Typography>
                </Button>
              </Box>
              <SearchComponent
                onSearch={handleSearchClick}
                value={filterState?.query}
              />
            </Box>
            <Box
              sx={{
                display: { xs: "flex", sm: "flex", md: "none" },
                overflowY: "auto",
                width: "100%",
              }}
            >
              <FilterChip
                filters={filterState.filters}
                staticFilter={staticFilter}
                handleFilterChange={handleFilterChange}
              />
            </Box>
          </Box>
        </Box>
      )}
      <Stack
        direction="row"
        sx={{ gap: 4, px: { xs: 2, md: 4 }, py: { xs: 1, md: 2 } }}
      >
        <Drawer
          anchor="left"
          open={isOpen}
          onClose={() => setIsOpen(false)}
          PaperProps={{
            sx: {
              width: "80%",
            },
          }}
        >
          <FilterComponent
            filterFramework={filterFramework}
            staticFilter={staticFilter}
            filterState={filterState}
            handleFilterChange={handleFilterChange}
            onlyFields={_content?.onlyFields ?? []}
            isOpenColapsed={_content?.isOpenColapsed ?? []}
            _config={{
              _filterText: { sx: { pt: 2, px: 2 } },
              _filterBox: { sx: { gap: 0 } },
              _filterBody: {
                sx: {
                  py: 2,
                  px: 2,
                  height: "calc(100vh - 130px)",
                  overflowY: "auto",
                },
              },
            }}
          />
          <Box
            sx={{
              bgcolor: "#f1f1f1",
              p: 2,
              position: "absolute",
              bottom: 0,
              width: "100%",
            }}
          >
            <Button
              variant="contained"
              fullWidth
              onClick={() => setIsOpen(false)}
            >
              {t("LEARNER_APP.COURSE.DONE")}
            </Button>
          </Box>
        </Drawer>

        <Box
          flex={35}
          sx={{
            display: { xs: "none", md: "flex" },
            position: "sticky",
            top: !title ? 0 : 100,
            alignSelf: "flex-start",
          }}
        >
          <FilterComponent
            filterFramework={filterFramework}
            staticFilter={staticFilter}
            filterState={filterState}
            handleFilterChange={handleFilterChange}
            onlyFields={_content?.onlyFields ?? []}
            isOpenColapsed={_content?.isOpenColapsed ?? []}
          />
        </Box>
        <Box flex={127}>
          {!title && (
            <Box
              display="flex"
              justifyContent="space-between"
              flexDirection={{
                xs: "column-reverse",
                sm: "column-reverse",
                md: "row",
              }}
              gap={2}
              sx={{ mb: 2 }}
            >
              <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                <FilterChip
                  filters={filterState.filters}
                  staticFilter={staticFilter}
                  handleFilterChange={handleFilterChange}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box sx={{ display: { xs: "block", md: "none" } }}>
                  <Button
                    variant="outlined"
                    onClick={() => setIsOpen(true)}
                    size="large"
                    sx={{
                      borderRadius: "8px",
                      borderWidth: "1px",
                      borderColor: "#DADADA !important",
                      padding: "8px 10px",
                    }}
                  >
                    <FilterList sx={{ width: 20, height: 20, mr: 0.5 }} />
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: "14px",
                        lineHeight: "20px",
                        letterSpacing: "0.1px",
                        mr: 0.5,
                      }}
                    >
                      {t("LEARNER_APP.CONTENT.FILTERS")}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: "14px",
                        lineHeight: "20px",
                        letterSpacing: "0.1px",
                      }}
                    >
                      {Object.keys(filterState?.filters || {}).filter(
                        (e) =>
                          ![
                            "limit",
                            ...Object.keys(staticFilter ?? {}),
                          ].includes(e)
                      ).length
                        ? `(${
                            Object.keys(filterState.filters).filter(
                              (e) =>
                                ![
                                  "limit",
                                  ...Object.keys(staticFilter ?? {}),
                                ].includes(e)
                            ).length
                          })`
                        : null}
                    </Typography>
                  </Button>
                </Box>
                <ButtonToggale icon={<Search />} _button={{ color: "primary" }}>
                  <SearchComponent
                    onSearch={handleSearchClick}
                    value={filterState?.query}
                  />
                </ButtonToggale>
              </Box>
            </Box>
          )}
          <Content
            key="content-mfe" // Prevent re-mounting
            isShowLayout={false}
            activeTab={activeTab}
            contentTabs={
              _content?.tab === "Course"
                ? ["Course"]
                : ["Course", "Learning Resource"]
            }
            showFilter={true}
            showSearch={false}
            showHelpDesk={false}
            filterFramework={filterFramework}
            staticFilter={staticFilter}
            {..._content}
            _config={{
              tabChange: handleTabChange,
              default_img: "/images/image_ver.png",
              _card: {},
              _subBox: { sx: { px: 0.5 } },
              userIdLocalstorageName: "userId",
              ..._content?._config,
            }}
            filters={{
              ...filterState,
              filters: {
                ...filterState.filters,
                ...staticFilter,
              },
            }}
          />
        </Box>
      </Stack>
    </Stack>
  );
});

interface FilterChipProps {
  filters: Record<string, any>;
  staticFilter?: Record<string, object>;
  handleFilterChange: (newFilterState: any) => void;
}

const FilterChip: React.FC<FilterChipProps> = ({
  filters,
  staticFilter,
  handleFilterChange,
}) => {
  return (
    <>
      {filters
        ? Object.entries(filters)
            .filter(
              ([key, _]) =>
                !["limit", ...Object.keys(staticFilter ?? {})].includes(key)
            )
            .map(([key, value], index) => {
              if (typeof value === "object") {
                return (value as string[]).map((option, index) => (
                  <Chip
                    key={`${key}-${index}`}
                    label={option}
                    onDelete={() => {
                      const { [key]: options, ...rest } = filters ?? {};
                      const newOptions = options.filter(
                        (o: any) => o !== option
                      );
                      if (newOptions.length === 0) {
                        handleFilterChange({
                          ...rest,
                        });
                      } else {
                        handleFilterChange({
                          ...rest,
                          [key]: newOptions,
                        });
                      }
                    }}
                    sx={{ mr: 1, mb: 1, borderRadius: "8px" }}
                  />
                ));
              } else {
                return (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    onDelete={() => {
                      const { [key]: _, ...rest } = filters ?? {};
                      handleFilterChange(rest);
                    }}
                    sx={{ mr: 1, mb: 1, borderRadius: "8px" }}
                  />
                );
              }
            })
        : null}
    </>
  );
};

const ButtonToggale = ({ children, icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        {isOpen && children}
        <Button
          onClick={toggle}
          variant="contained"
          color="primary"
          sx={{ ml: 1, borderRadius: "8px" }}
        >
          {isOpen ? <CloseIcon /> : icon}
        </Button>
      </Box>
    </Box>
  );
};
