import React, { memo, useState, useMemo, useEffect, use } from 'react';
import { CommonSearch, useTranslation } from '@shared-lib';
import { Search as SearchIcon } from '@mui/icons-material';
import debounce from 'lodash/debounce';

export default memo(function SearchComponent({
  onSearch,
  value,
}: {
  value: string;
  onSearch: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState(value || '');

  // Debounced function (only called for non-empty values)
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        if (value?.trim() !== '') {
          onSearch(value?.trim());
        }
      }, 300),
    [onSearch]
  );

  useEffect(() => {
    const trimmed = searchValue?.trim();

    if (trimmed === '') {
      // Immediately clear results (optional: depending on your app logic)
      debouncedSearch.cancel(); // Cancel any pending debounced call
      onSearch(''); // Notify parent to clear results
      return;
    }

    debouncedSearch(trimmed);

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchValue, debouncedSearch, onSearch]);

  useEffect(() => {
    setSearchValue(value || '');
  }, [value]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchClick = () => {
    const trimmed = searchValue.trim();
    debouncedSearch.cancel(); // Cancel debounce before immediate search

    if (trimmed !== '') {
      onSearch(trimmed);
    } else {
      onSearch(''); // Ensure reset on manual clear + click
    }
  };

  return (
    <CommonSearch
      placeholder={t('LEARNER_APP.SEARCH_COMPONENT.PLACEHOLDER')}
      rightIcon={<SearchIcon />}
      onRightIconClick={handleSearchClick}
      inputValue={searchValue}
      onInputChange={(event) => handleSearchChange(event.target.value)}
      onKeyPress={(ev: any) => {
        if (ev.key === 'Enter') {
          handleSearchClick();
        }
      }}
      sx={{
        backgroundColor: '#fff',
        borderRadius: '50px',
        border: '1px solid  #D0C5B4',
        width: '100%',
      }}
    />
  );
});
