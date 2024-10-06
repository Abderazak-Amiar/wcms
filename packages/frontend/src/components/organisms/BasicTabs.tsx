import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import * as React from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

type basicTabsPropTypes = {
  labels: string[];
  components: React.ReactNode[];
};
export default function BasicTabs(props: basicTabsPropTypes) {
  const { labels, components } = props;
  const [value, setValue] = React.useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          {labels.map((label: string, index: number) => (
            <Tab
              key={label + 'menu-item'}
              label={label}
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Box>
      {labels.map((label: string, index: number) => (
        <CustomTabPanel key={label + 'comp'} value={value} index={index}>
          {components[index]}
        </CustomTabPanel>
      ))}
    </Box>
  );
}
