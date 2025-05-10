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
import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import {
  deleteCounters,
  getCounters,
  updateCounter,
} from '../../../api/apollo'; // Update imports

interface Counter {
  counterID: string;
  consumerID: string;
  status: string;
  createdAt: string;
  price: string;
  consumer: { fullName: string };
}

type Order = 'asc' | 'desc';

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator<Key extends keyof Counter>(
  order: Order,
  orderBy: Key,
): (a: Counter, b: Counter) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface HeadCell {
  id: keyof Counter;
  label: string;
  numeric: boolean;
  disablePadding: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'counterID',
    numeric: false,
    disablePadding: true,
    label: 'Numéro Compteur',
  },
  {
    id: 'consumerID',
    numeric: false,
    disablePadding: false,
    label: 'Propriétaire',
  },
  {
    id: 'status',
    numeric: false,
    disablePadding: false,
    label: 'Status',
  },
  {
    id: 'createdAt',
    numeric: false,
    disablePadding: false,
    label: 'Date de Création',
  },
  {
    id: 'price',
    numeric: true,
    disablePadding: false,
    label: 'Prix(DA)',
  },
];

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Counter,
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
    (property: keyof Counter) => (event: React.MouseEvent<unknown>) => {
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
            inputProps={{ 'aria-label': 'select all counters' }}
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
  counters: Counter[];
  setCounters: React.Dispatch<React.SetStateAction<Counter[]>>;
  refetchCounters: () => void;
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
          Liste des compteurs
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
  counter: Counter | null;
  onSave: (counter: Counter) => void;
}

const EditDialog = ({ open, onClose, counter, onSave }: EditDialogProps) => {
  const [editedCounter, setEditedCounter] = useState<Counter | null>(counter);

  useEffect(() => {
    setEditedCounter(counter);
  }, [counter]);

  const handleChange = (field: keyof Counter, value: string) => {
    if (editedCounter) {
      setEditedCounter({ ...editedCounter, [field]: value });
    }
  };

  const handleSave = () => {
    if (editedCounter) {
      onSave(editedCounter);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Mettre à jour Compteur</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={['En Marche', 'En Arrêt', 'Coupé']}
          value={editedCounter?.status || ''}
          onChange={(_event, newValue) => handleChange('status', newValue || '')}
          renderInput={(params) => (
            <TextField {...params} label="Status" margin="dense" fullWidth />
          )}
        />
        <TextField
          margin="dense"
          label="Prix"
          fullWidth
          value={editedCounter?.price || ''}
          onChange={(e) => handleChange('price', e.target.value)}
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
      <DialogTitle>Delete Counters</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the selected counters?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function CounterList() {
  const { loading, error, data, refetch } = useQuery(getCounters);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Counter>('consumerID');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [currentCounter, setCurrentCounter] = useState<Counter | null>(null);

  const [deleteCounterMutation] = useMutation(deleteCounters, {
    onCompleted: () => {
      enqueueSnackbar('Compteur(s) supprimé(s)', {
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
    if (data?.counters) {
      setCounters(data.counters);
    }
  }, [data]);

  const refetchCounters = () => {
    refetch();
  };

  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: keyof Counter,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = counters.map((n) => n.counterID);
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

  const handleEdit = (counter: Counter) => {
    setCurrentCounter(counter);
    setEditDialogOpen(true);
  };

  const [updateCounterMutation] = useMutation(updateCounter, {
    onCompleted: (data) => {
      if (data.updateCounter.success) {
        enqueueSnackbar('Compteur mis à jour avec succès', {
          variant: 'success',
          style: { fontSize: '18px' },
        });
        refetch();
      }
    },
    onError: (error) => {
      if (
        error.message.includes(
          'COUNTER EN MARCHE ALREADY EXISTS for this consumer',
        )
      ) {
        enqueueSnackbar('Possède un compteur en marche', {
          variant: 'warning',
          style: { fontSize: '18px' },
        });
      }
    },
  });

  const handleSave = (counter: Counter) => {
    if (!counter) return;

    updateCounterMutation({
      variables: {
        counterID: counter.counterID,
        price: counter.price,
        status: counter.status,
        consumerID: counter.consumerID,
      },
    });
  };

  const handleDelete = async () => {
    if (!selected || selected.length === 0) {
      console.error('No counters selected for deletion');
      return;
    }

    try {
      // Perform the mutation
      const response = await deleteCounterMutation({
        variables: { counterIDs: selected },
      });

      // Optimistic update
      const newCounters = counters.filter(
        (counter) => !selected.includes(counter.counterID),
      );
      setCounters(newCounters);
      setSelected([]);

      // Refetch the data
      refetchCounters();

      console.log('Counters deleted:', response.data.deleteCounters);
    } catch (err) {
      console.error('Error deleting counters:', err);
    }
  };

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - counters.length) : 0;

  const visibleRows = React.useMemo(
    () =>
      [...counters]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, counters],
  );
  useEffect(() => {
    refetchCounters();
  }, []);
  if (loading) return <Typography>Loading...</Typography>;
  if (error)
    return <Typography color="error">Error: {error.message}</Typography>;
  console.log('==>visibleRows', visibleRows);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar
          numSelected={selected.length}
          selected={selected}
          counters={counters}
          setCounters={setCounters}
          refetchCounters={refetchCounters}
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
              rowCount={counters.length}
            />
            <TableBody>
              {visibleRows.map((row) => {
                const isItemSelected = selected.includes(row.counterID);
                const labelId = `enhanced-table-checkbox-${row.counterID}`;

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, row.counterID)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.counterID}
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
                    <TableCell align="left">{row?.counterID}</TableCell>
                    <TableCell align="left">
                      {row?.consumer?.fullName}
                    </TableCell>
                    <TableCell align="left">{row?.status}</TableCell>
                    <TableCell align="left">
                      {moment(row.createdAt).format('DD MMM YYYY')}
                    </TableCell>
                    <TableCell align="right">{row.price}</TableCell>
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
                  <TableCell colSpan={7} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={counters.length}
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
        counter={currentCounter}
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
