import { Autocomplete, TextField } from '@mui/material';
import React from 'react';
import { getCurrentTrimester } from '../../helpers/getCurrentTrimester';

const trimesters = ['Jan - Mar', 'Apr - Jun', 'Jul - Sep', 'Oct - Dec'];

interface TrimesterSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const TrimesterSelector: React.FC<TrimesterSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <Autocomplete
      style={{ marginTop: '8px' }}
      options={trimesters}
      value={value}
      onChange={(_, newValue) => onChange(newValue || getCurrentTrimester())}
      renderInput={(params) => (
        <TextField {...params} label="Trimestre" variant="outlined" fullWidth />
      )}
    />
  );
};

export { TrimesterSelector };
