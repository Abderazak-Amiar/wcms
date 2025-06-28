import { useMutation, useQuery } from '@apollo/client';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { visuallyHidden } from '@mui/utils';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { deleteUsers, getUsers, updateUser } from '../../../api/apollo'; // Update imports to match your API

interface User {
  userID: string;
  userName: string;
  role: string;
  password: string;
  createdAt: string;
}

type Order = 'asc' | 'desc';

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator<Key extends keyof User>(
  order: Order,
  orderBy: Key,
): (a: User, b: User) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface HeadCell {
  id: keyof User;
  label: string;
  numeric: boolean;
  disablePadding: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'userID',
    numeric: false,
    disablePadding: true,
    label: 'ID Utilisateur',
  },
  {
    id: 'userName',
    numeric: false,
    disablePadding: false,
    label: 'Nom Utilisateur',
  },
  {
    id: 'role',
    numeric: false,
    disablePadding: false,
    label: 'Rôle',
  },
  {
    id: 'createdAt',
    numeric: false,
    disablePadding: false,
    label: 'Date de Création',
  },
];

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof User,
  ) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;
  const createSortHandler =
    (property: keyof User) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all users' }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{ fontWeight: 'bold' }}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
        <TableCell sx={{ fontWeight: 'bold' }} align="right">
          Actions
        </TableCell>
      </TableRow>
    </TableHead>
  );
}

interface EnhancedTableToolbarProps {
  numSelected: number;
  selected: string[];
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  refetchUsers: () => void;
  setDeleteConfirmationOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const EnhancedTableToolbar = ({
  numSelected,
  setDeleteConfirmationOpen,
}: EnhancedTableToolbarProps) => {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} selected
        </Typography>
      ) : (
        <Typography
          sx={{ flex: '1 1 100%', fontWeight: 'bold' }}
          variant="h6"
          component="div"
        >
          Liste des utilisateurs
        </Typography>
      )}
      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton
            onClick={() => setDeleteConfirmationOpen(true)}
            disabled={false}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filtre">
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
};

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (user: User) => void;
}

const EditDialog = ({ open, onClose, user, onSave }: EditDialogProps) => {
  const [editedUser, setEditedUser] = useState<User | null>(user);

  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  const handleChange = (field: keyof User, value: string) => {
    if (editedUser) {
      setEditedUser({ ...editedUser, [field]: value });
    }
  };

  const handleSave = () => {
    if (editedUser) {
      onSave(editedUser);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Mettre à jour Utilisateur</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Nom d'utilisateur"
          fullWidth
          value={editedUser?.userName || ''}
          onChange={(e) => handleChange('userName', e.target.value)}
        />
        <TextField
          margin="dense"
          type="password"
          label="Mot de passe"
          fullWidth
          value={editedUser?.password || ''}
          onChange={(e) => handleChange('password', e.target.value)}
        />
        <Autocomplete
          options={['administrateur', 'utilisateur']} // Adjust roles as needed
          value={editedUser?.role || ''}
          onChange={(_event, newValue) => handleChange('role', newValue || '')}
          renderInput={(params) => (
            <TextField {...params} label="Rôle" margin="dense" fullWidth />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSave}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
};

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
}: DeleteConfirmationDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Supprimer Utilisateurs</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Êtes-vous sûr de vouloir supprimer les utilisateurs sélectionnés?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onConfirm} color="error">
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function UserList() {
  const { loading, error, data, refetch } = useQuery(getUsers);
  const [users, setUsers] = useState<User[]>([]);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof User>('userName');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [deleteUserMutation] = useMutation(deleteUsers, {
    onCompleted: () => {
      enqueueSnackbar('Utilisateur(s) supprimé(s)', {
        variant: 'success',
      });
      refetch();
      setSelected([]);
      setDeleteConfirmationOpen(false);
    },
    onError: () => {
      enqueueSnackbar('Erreur de suppression', { variant: 'error' });
    },
  });

  useEffect(() => {
    if (data?.users) {
      setUsers(data.users);
    }
  }, [data]);

  const refetchUsers = () => {
    refetch();
  };
console.log('==>USERS',users);
  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: keyof User,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = users.map((n) => n.userID);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (_event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDense(event.target.checked);
  };

  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setEditDialogOpen(true);
  };

  const [updateUserMutation] = useMutation(updateUser, {
    onCompleted: (data) => {
      if (data.updateUser.success) {
        enqueueSnackbar('Utilisateur mis à jour', {
          variant: 'success',
          style: { fontSize: '14px' },
        });
        refetch();
      }
    },
    onError: () => {
      enqueueSnackbar(`Erreur lors de la mise à jour`, {
        variant: 'error',
        style: { fontSize: '14px' },
      });
    },
  });

  const handleSave = (user: User) => {
    if (!user) return;

    updateUserMutation({
      variables: {
        userID: user.userID,
        userName: user.userName,
        password: user.password,
        role: user.role,
      },
    });
  };

  const handleDelete = async () => {
    if (!selected || selected.length === 0) {
      console.error('No users selected for deletion');
      return;
    }

    try {
      // Perform the mutation
      const response = await deleteUserMutation({
        variables: { userIDs: selected },
      });

      // Optimistic update
      const newUsers = users.filter((user) => !selected.includes(user.userID));
      setUsers(newUsers);
      setSelected([]);

      // Refetch the data
      refetchUsers();

      console.log('Users deleted:', response.data.deleteUsers);
    } catch (err) {
      console.error('Error deleting users:', err);
    }
  };

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - users.length) : 0;

  const visibleRows = React.useMemo(
    () =>
      [...users]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, users],
  );

  useEffect(() => {
    refetchUsers();
  }, []);

  if (loading) return <Typography>Chargement...</Typography>;
  if (error)
    return <Typography color="error">Erreur: {error.message}</Typography>;

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar
          numSelected={selected.length}
          selected={selected}
          users={users}
          setUsers={setUsers}
          refetchUsers={refetchUsers}
          setDeleteConfirmationOpen={setDeleteConfirmationOpen}
        />
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size={dense ? 'small' : 'medium'}
          >
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={users.length}
            />
            <TableBody>
              {visibleRows.map((row) => {
                const isItemSelected = selected.includes(row.userID);
                const labelId = `enhanced-table-checkbox-${row.userID}`;

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, row.userID)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.userID}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{
                          'aria-labelledby': labelId,
                        }}
                      />
                    </TableCell>
                    <TableCell align="left">{row.userID}</TableCell>
                    <TableCell align="left">{row.userName}</TableCell>
                    <TableCell align="left">{row.role}</TableCell>
                    <TableCell align="left">
                      {moment(row.createdAt).format('DD MMM YYYY')}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleEdit(row)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: (dense ? 33 : 53) * emptyRows,
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page"
        />
      </Paper>
      <FormControlLabel
        control={<Switch checked={dense} onChange={handleChangeDense} />}
        label="Marge dense"
      />
      <EditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        user={currentUser}
        onSave={handleSave}
      />
      <DeleteConfirmationDialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
