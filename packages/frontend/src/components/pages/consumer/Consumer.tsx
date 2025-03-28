import { Box } from '@mui/material';
import BasicTabs from '../../organisms/BasicTabs';
import AddConsumer from './AddConsumer';
import ConsumerList from './ConsumerList';

function Consumers() {
  return (
    <Box sx={{ background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)' }}>
      <BasicTabs
        labels={['List', 'Ajouter']}
        components={[<ConsumerList />, <AddConsumer />]}
      />
    </Box>
  );
}

export default Consumers;
