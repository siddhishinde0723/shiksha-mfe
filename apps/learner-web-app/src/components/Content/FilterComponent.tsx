import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { useTranslation, FilterForm } from '@shared-lib';
import { useColorInversion } from '../../context/ColorInversionContext';
import { logEvent } from '@learner/utils/googleAnalytics';

const FilterComponent: React.FC<{
  filterState: any;
  filterFramework?: any;
  staticFilter?: Record<string, object>;
  handleFilterChange: (newFilterState: any) => void;
  onlyFields?: string[];
  isOpenColapsed?: boolean | any[];
  _config?: any;
}> = ({
  filterState,
  staticFilter,
  filterFramework,
  handleFilterChange,
  onlyFields,
  isOpenColapsed,
  _config,
}) => {
  const { t } = useTranslation();
  const [filterCount, setFilterCount] = useState<any>();
  const theme = useTheme();
  const { isColorInverted } = useColorInversion();
  let cleanedUrl = '';
if (typeof window !== 'undefined') {
  const windowUrl = window.location.pathname;
  cleanedUrl = windowUrl;
}
  const checkboxStyle = useMemo(
    () => ({
      color: isColorInverted ? '#fff' : '#1F1B13',
      '&.Mui-checked': {
        color: isColorInverted ? '#fff' : '#1F1B13',
      },
    }),
    [isColorInverted]
  );

  useEffect(() => {
    // Calculate filter count excluding limit, staticFilter keys, and empty values
    const activeFilters = Object?.keys(filterState.filters ?? {}).filter((e) => {
      if (e?.toString() === 'limit') return false;
      // Exclude staticFilter keys
      if (staticFilter && Object.keys(staticFilter).includes(e)) return false;
      const filterValue = filterState.filters[e];
      // Exclude empty arrays
      if (Array.isArray(filterValue) && filterValue.length === 0) return false;
      // Exclude empty strings
      if (typeof filterValue === 'string' && filterValue.trim() === '') return false;
      // Exclude null/undefined
      if (filterValue === null || filterValue === undefined) return false;
      return true;
    });
    setFilterCount(activeFilters.length);
  }, [filterState, staticFilter]);

  // Store previous filter state for comparison
  const prevFilterState = useRef<any>({});

  // Helper to compare arrays
  const arraysEqual = (a: any[], b: any[]) =>
    Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);

  // Helper to check if value changed
  const hasChanged = (key: string, newVal: any) => {
    const prevVal = prevFilterState.current[key];
    if (Array.isArray(newVal)) return !arraysEqual(prevVal, newVal);
    return prevVal !== newVal;
  };

  // Filter out invalid terms from filterFramework before passing to FilterForm
  const cleanedFilterFramework = useMemo(() => {
    if (!filterFramework?.framework?.categories) return filterFramework;
    
    const cleanedCategories = filterFramework.framework.categories.map((category: any) => {
      const originalTerms = category.terms || [];
      const filteredTerms = originalTerms.filter((term: any) => {
        const hasTemplate = term.code?.includes('{{') || 
                            term.name?.includes('{{') || 
                            term.code?.includes('}}') || 
                            term.name?.includes('}}');
        
        const isLive = term.status === 'Live' || term.status === undefined || term.status === null;
        const hasValidName = term.name && term.name.trim() !== '';
        const hasValidCode = term.code && term.code.trim() !== '';
        
        const isValid = !hasTemplate && isLive && hasValidName && hasValidCode;
        
        if (!isValid) {
          console.log(`🚫 FilterComponent - Filtering out term: "${term.name}" ("${term.code}") - Template: ${hasTemplate}, Live: ${isLive}, ValidName: ${hasValidName}, ValidCode: ${hasValidCode}`);
        }
        
        return isValid;
      });
      
      
      // Special logging for subjects
      if (category.name?.toLowerCase().includes('subject') || category.code?.toLowerCase().includes('subject')) {
        console.log(`🎯 SUBJECTS FOUND: ${filteredTerms.length} subjects available:`, filteredTerms.map(t => t.name));
      }
      
      return {
        ...category,
        terms: filteredTerms
      };
    });
    
    return {
      ...filterFramework,
      framework: {
        ...filterFramework.framework,
        categories: cleanedCategories
      }
    };
  }, [filterFramework]);

  const memoizedFilterForm = useMemo(
    () => (
      <FilterForm
        _config={{
          t: t,
          _filterBody: _config?._filterBody,
          _checkbox: {
            sx: checkboxStyle,
          },
          _formControl: {
            sx: {
              '& .MuiSelect-select': {
                maxHeight: 'none', // Remove height restrictions
              },
              '& .MuiMenu-paper': {
                maxHeight: 'none !important', // Remove all height restrictions
                overflow: 'visible !important',
              },
              '& .MuiMenu-list': {
                maxHeight: 'none !important', // Remove all height restrictions
                overflow: 'visible !important',
              },
              // Hide any "show more" buttons
              '& button[class*="show-more"], & button[class*="show-more"], & .show-more, & .show-less': {
                display: 'none !important',
              },
              // Ensure all options are visible and force show all items
              '& .MuiMenuItem-root': {
                display: 'block !important',
              },
              // Force show all options without pagination
              '& [data-testid*="virtualized"], & .virtualized': {
                height: 'auto !important',
                maxHeight: 'none !important',
              },
            },
          },
        }}
        onApply={(newFilterState: any) => {
          // Calculate filter count excluding limit, staticFilter keys, and empty values
          const activeFilters = Object?.keys(newFilterState ?? {}).filter((e) => {
            if (e?.toString() === 'limit') return false;
            // Exclude staticFilter keys
            if (staticFilter && Object.keys(staticFilter).includes(e)) return false;
            // Exclude empty arrays
            const value = newFilterState[e];
            if (Array.isArray(value) && value.length === 0) return false;
            // Exclude empty strings
            if (typeof value === 'string' && value.trim() === '') return false;
            // Exclude null/undefined
            if (value === null || value === undefined) return false;
            return true;
          });
          setFilterCount(activeFilters.length);
          console.log('FilterComponent: onApply', newFilterState);

          // Only log if value changed
          if (newFilterState?.se_domains && hasChanged('se_domains', newFilterState.se_domains)) {
            logEvent({
              action: 'filter-selection-by-domain:' + newFilterState.se_domains.join(','),
              category: cleanedUrl ,
              label: 'Selection of domain',
            });
          }
          if (newFilterState?.se_subDomains && hasChanged('se_subDomains', newFilterState.se_subDomains)) {
            logEvent({
              action: 'filter-selection-by-category:' + newFilterState.se_subDomains.join(','),
              category: cleanedUrl,
              label: 'Selection of category',
            });
          }
          if (newFilterState?.se_subjects && hasChanged('se_subjects', newFilterState.se_subjects)) {
            logEvent({
              action: 'filter-selection-by-subject:' + newFilterState.se_subjects.join(','),
              category: cleanedUrl ,
              label: 'Selection of subject',
            });
          }
          if (newFilterState?.targetAgeGroup && hasChanged('targetAgeGroup', newFilterState.targetAgeGroup)) {
            logEvent({
              action: 'filter-selection-by-age-group:' + newFilterState.targetAgeGroup.join(','),
              category: cleanedUrl ,
              label: 'Selection of age group',
            });
          }
          if (newFilterState?.primaryUser && hasChanged('primaryUser', newFilterState.primaryUser)) {
            logEvent({
              action: 'filter-selection-by-primary-user:' + newFilterState.primaryUser.join(','),
              category: cleanedUrl,
              label: 'Selection of primary user',
            });
          }
          if (newFilterState?.contentLanguage && hasChanged('contentLanguage', newFilterState.contentLanguage)) {
            logEvent({
              action: 'filter-selection-by-content-language:' + newFilterState.contentLanguage.join(',').toString(),
              category: cleanedUrl,
              label: 'Selection of content language',
            });
          }

          // Update previous filter state
          prevFilterState.current = { ...newFilterState };

          handleFilterChange(newFilterState);
        }}
        onlyFields={onlyFields}
        isOpenColapsed={isOpenColapsed}
        filterFramework={cleanedFilterFramework}
        orginalFormData={filterState?.filters ?? {}}
        staticFilter={staticFilter}
        showAllOptions={true}
      />
    ),
    [
      handleFilterChange,
      cleanedFilterFramework,
      isOpenColapsed,
      staticFilter,
      onlyFields,
      filterState,
      _config,
      checkboxStyle,
    ]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        // Global CSS overrides to disable "show more" functionality and show all options
        '& *': {
          '& button[class*="show-more"], & button[class*="show-less"], & .show-more, & .show-less': {
            display: 'none !important',
          },
          // Force all menu items to be visible
          '& .MuiMenuItem-root': {
            display: 'block !important',
          },
          // Override any height restrictions
          '& .MuiMenu-list, & .MuiMenu-paper': {
            maxHeight: 'none !important',
            height: 'auto !important',
          },
        },
        ...(_config?._filterBox?.sx ?? {}),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #D0C5B4',
          pb: 2,
          ...(_config?._filterText?.sx ?? {}),
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 500,
          }}
        >
          {t('LEARNER_APP.COURSE.FILTER_BY')}{' '}
          {filterCount > 0 && `(${filterCount})`}
        </Typography>
        {filterCount > 0 && (
          <Button
            variant="text"
            sx={{
              color: theme.palette.secondary.main,
            }}
            onClick={() => {
              setFilterCount(0);
              // Pass empty object to clear all filters
              handleFilterChange({});
              // Force update by triggering a re-render with empty filters
              // The FilterForm will react to the orginalFormData change
            }}
          >
            {t('LEARNER_APP.COURSE.CLEAR_FILTER')}
          </Button>
        )}
      </Box>
      {memoizedFilterForm}
    </Box>
  );
};

export default React.memo(FilterComponent);
