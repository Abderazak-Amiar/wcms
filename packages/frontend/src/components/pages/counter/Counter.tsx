import { Box } from '@mui/material';
import BasicTabs from '../../organisms/BasicTabs';
import AddCounter from './AddCounter';
import CounterList from './CounterList';

function Counter() {
  return (
    <Box>
      <BasicTabs
        labels={['Ajouter', 'List']}
        components={[<AddCounter />, <CounterList />]}
      />
    </Box>
  );
}

export default Counter;
