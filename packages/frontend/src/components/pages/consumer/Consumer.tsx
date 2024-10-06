import { Box } from '@mui/material';
import BasicTabs from '../../organisms/BasicTabs';
import ConsumerList from './ConsumerList';
import AddConsumer from './AddConsumer';


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
