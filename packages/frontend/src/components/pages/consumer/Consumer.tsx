import { Box } from '@mui/material';
import BasicTabs from '../../organisms/BasicTabs';
import AddConsumer from './AddConsumer';
import ConsumerList from './ConsumerList';

function Consumers() {
  return (
    <Box>
      <BasicTabs
        labels={['List', 'Ajouter']}
        components={[<ConsumerList />, <AddConsumer />]}
      />
    </Box>
  );
}

export default Consumers;
