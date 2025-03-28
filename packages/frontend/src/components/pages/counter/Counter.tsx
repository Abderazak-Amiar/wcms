import { Box } from '@mui/material';
import BasicTabs from '../../organisms/BasicTabs';
import AddCounter from './AddCounter';
import CounterList from './CounterList';

function Counter() {
  return (
    <Box sx={{ background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)' }}>
      <BasicTabs
        labels={['List', 'Ajouter']}
        components={[<CounterList />, <AddCounter />]}
      />
    </Box>
  );
}

export default Counter;
