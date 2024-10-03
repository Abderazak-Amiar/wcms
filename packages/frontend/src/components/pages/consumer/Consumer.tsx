import { Box } from '@mui/material';
import BasicTabs from '../../organisms/BasicTabs';
import AddConsumer from './addConsumer';
import ConsumerList from './ConsumerList';

function Consumers() {
  return (
    <Box>
      <BasicTabs
        labels={['Ajouter', 'List']}
        components={[<AddConsumer />, <ConsumerList />]}
      />
    </Box>
  );
}

export default Consumers;
