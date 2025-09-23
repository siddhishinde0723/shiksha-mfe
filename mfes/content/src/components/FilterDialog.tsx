import CloseIcon from '@mui/icons-material/Close';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Box, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Checkbox, 
  ListItemText, 
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React, { useState, useEffect } from 'react';

const FilterDialog = ({
  open,
  onClose,
  onApply,
  filterValues,
  filterFramework,
  staticFilter,
}: {
  open: boolean;
  onClose: () => void;
  onApply?: (data: any) => void;
  filterValues: any;
  filterFramework?: any;
  staticFilter?: any;
}) => {
  const [selectedFilters, setSelectedFilters] = useState<any>({});

  useEffect(() => {
    if (open) {
      setSelectedFilters(filterValues?.filters || {});
      // Debug: Log framework data to see what's available
      console.log('🔍 FilterDialog - Framework Data:', filterFramework);
      console.log('🔍 FilterDialog - Framework Categories:', filterFramework?.framework?.categories);
      console.log('🔍 FilterDialog - Framework Categories Length:', filterFramework?.framework?.categories?.length);
      console.log('🔍 FilterDialog - Static Filter:', staticFilter);
      
      // Log each category individually
      if (filterFramework?.framework?.categories) {
        filterFramework.framework.categories.forEach((category: any, index: number) => {
          console.log(`🔍 FilterDialog Category ${index + 1}:`, {
            name: category.name,
            code: category.code,
            identifier: category.identifier,
            termsCount: category.terms?.length || 0,
            terms: category.terms
          });
        });
      }
    }
  }, [open, filterValues, filterFramework, staticFilter]);

  const handleFilterChange = (categoryCode: string, values: string[]) => {
    setSelectedFilters((prev: any) => ({
      ...prev,
      [categoryCode]: values,
    }));
  };

  const handleApply = () => {
    onApply?.(selectedFilters);
  };

  const handleClearAll = () => {
    setSelectedFilters({});
    onApply?.({});
  };

  const renderFrameworkCategory = (category: any) => {
    console.log('🔍 Rendering category:', category.name, category.code, 'Terms:', category.terms?.length || 0);
    
    if (!category?.terms || category.terms.length === 0) {
      console.log('🔍 Skipping category (no terms):', category.name);
      return null;
    }

    // Map framework category codes to filter field names
    const categoryMapping: { [key: string]: string } = {
      'gradeLevel': 'se_gradeLevels',
      'medium': 'se_mediums', 
      'subject': 'se_subjects',
      'board': 'se_boards',
      'topic': 'se_topics',
      'subtopic': 'se_subtopics'
    };

    const filterKey = categoryMapping[category.code] || `se_${category.code}s`;
    const currentValues = selectedFilters[filterKey] || [];
    
    console.log('🔍 Rendering category with filterKey:', filterKey, 'Current values:', currentValues);
    
    return (
      <Accordion key={category.identifier} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="bold">
            {category.name} ({category.terms.length} options)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth>
            <InputLabel>{category.name}</InputLabel>
            <Select
              multiple
              value={currentValues}
              onChange={(e) => handleFilterChange(filterKey, e.target.value as string[])}
              renderValue={(selected) => (selected as string[]).join(', ')}
            >
              {category.terms.map((term: any) => (
                <MenuItem key={term.code} value={term.code}>
                  <Checkbox checked={currentValues.includes(term.code)} />
                  <ListItemText primary={term.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderStaticFilter = (label: string, options: string[], filterKey: string) => {
    const currentValues = selectedFilters[filterKey] || [];
    
    return (
      <Accordion key={filterKey} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="bold">
            {label}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select
              multiple
              value={currentValues}
              onChange={(e) => handleFilterChange(filterKey, e.target.value as string[])}
              renderValue={(selected) => (selected as string[]).join(', ')}
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  <Checkbox checked={currentValues.includes(option)} />
                  <ListItemText primary={option} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      sx={{
        borderRadius: '16px',
        '& .MuiDialog-paper': { backgroundColor: '#FEF7FF' },
      }}
      onClose={onClose}
    >
      <DialogTitle>Filters</DialogTitle>
      <IconButton
        sx={(theme) => ({
          position: 'absolute',
          top: 8,
          right: 8,
          color: theme.palette.grey[500],
        })}
        onClick={onClose}
        aria-label="close"
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Debug: {filterFramework?.framework?.categories?.length || 0} framework categories found
              </Typography>
              {filterFramework?.framework?.categories?.map((cat: any, index: number) => (
                <Typography key={index} variant="caption" display="block" color="text.secondary">
                  {index + 1}. {cat.name} ({cat.code}) - {cat.terms?.length || 0} terms
                </Typography>
              ))}
            </Box>
          )}

          {/* Framework Categories */}
          {filterFramework?.framework?.categories?.length > 0 ? (
            filterFramework.framework.categories.map((category: any) => 
              renderFrameworkCategory(category)
            )
          ) : (
            <Box sx={{ p: 2, bgcolor: '#fff3cd', borderRadius: 1 }}>
              <Typography variant="body2" color="warning.main">
                No framework categories found. Please check your framework configuration.
              </Typography>
            </Box>
          )}
          
          {/* Static Filters */}
          {renderStaticFilter(
            'Content Language', 
            ['English', 'Hindi', 'Telugu', 'Tamil', 'Bengali', 'Kannada', 'Malayalam', 'Gujarati', 'Marathi'],
            'contentLanguage'
          )}
          
          {renderStaticFilter(
            'Content Type', 
            ['Video', 'PDF', 'Interactive Content', 'Assessment', 'Audio', 'Document', 'Image'],
            'contentType'
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
            <Button
              onClick={handleClearAll}
              variant="outlined"
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(FilterDialog);
