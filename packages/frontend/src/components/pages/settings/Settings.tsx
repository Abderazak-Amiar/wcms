import { Box } from '@mui/material';
import BasicTabs from '../../organisms/BasicTabs';
import AddUser from './AddUser';
import UserList from './UserList';
import UserSetting from './UserSetting';

function Settings() {
  return (
    <Box sx={{ background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)' }}>
      <BasicTabs
        labels={[
          'Paramètres Général',
          'Nouveau Utilisateur',
          'Liste des Utilisateurs',
        ]}
        components={[<UserSetting />, <AddUser />, <UserList />]}
      />
    </Box>
  );
}

export default Settings;
