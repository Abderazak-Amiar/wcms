import { useMutation, useQuery } from '@apollo/client';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  Box,
  Checkbox,
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
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { visuallyHidden } from '@mui/utils';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { deleteConsumers, getConsumers } from '../../../api/apollo';

interface Consumer {
  consumerID: string;
  fullName: string;
  createdAt: string;
}

type Order = 'asc' | 'desc';

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: string | number },
  b: { [key in Key]: string | number },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface HeadCell {
  id: keyof Consumer;
  label: string;
  numeric: boolean;
  disablePadding: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'consumerID',
    numeric: false,
    disablePadding: true,
    label: 'Identificateur',
  },
  {
    id: 'fullName',
    numeric: false,
    disablePadding: false,
    label: 'Nom complet',
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
    property: keyof Consumer,
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
    (property: keyof Consumer) => (event: React.MouseEvent<unknown>) => {
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
            inputProps={{ 'aria-label': 'select all consumers' }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
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
      </TableRow>
    </TableHead>
  );
}

interface EnhancedTableToolbarProps {
  numSelected: number;
  selected: string[];
  consumers: Consumer[];
  setConsumers: React.Dispatch<React.SetStateAction<Consumer[]>>;
  refetchConsumers: () => void; // New prop for refetch
}

const EnhancedTableToolbar = ({
  numSelected,
  selected,
  consumers,
  setConsumers,
  refetchConsumers, // Use refetch in toolbar
}: EnhancedTableToolbarProps) => {
  const [deleteConsumer, { loading, error }] = useMutation(deleteConsumers);

  const handleDelete = async (consumerIDs: string[]) => {
    if (!consumerIDs || consumerIDs.length === 0) {
      console.error('No consumers selected for deletion');
      return;
    }

    try {
      // Optimistic update - immediately remove selected consumers from the UI
      const newConsumers = consumers.filter(
        (consumer) => !consumerIDs.includes(consumer.consumerID),
      );
      setConsumers(newConsumers);

      // Perform the mutation
      const response = await deleteConsumer({
        variables: { consumerId: consumerIDs },
      });

      // Refetch the data after successful deletion
      refetchConsumers();

      console.log('Consumers deleted:', response.data.deleteConsumers);
    } catch (err) {
      console.error('Error deleting consumers:', err);
      setConsumers(consumers); // Restore the consumers list if deletion fails
    }
  };

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
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" component="div">
          Liste des consommateurs
        </Typography>
      )}
      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton onClick={() => handleDelete(selected)} disabled={loading}>
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

export default function ConsumerList() {
  const { loading, error, data, refetch } = useQuery(getConsumers);
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Consumer>('fullName');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    if (data?.consumers) {
      setConsumers(data.consumers);
    }
  }, [data]);

  // Pass the refetch function to the toolbar
  const refetchConsumers = () => {
    refetch();
  };

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Consumer,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = consumers.map((n) => n.consumerID);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
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

  const handleChangePage = (event: unknown, newPage: number) => {
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

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - consumers.length) : 0;

  const visibleRows = React.useMemo(
    () =>
      [...consumers]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, consumers],
  );

  if (loading) return <Typography>Loading...</Typography>;
  if (error)
    return <Typography color="error">Error: {error.message}</Typography>;

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar
          numSelected={selected.length}
          selected={selected}
          consumers={consumers}
          setConsumers={setConsumers}
          refetchConsumers={refetchConsumers} // Pass refetchConsumers here
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
              rowCount={consumers.length}
            />
            <TableBody>
              {visibleRows.map((row, index) => {
                console.log('==>row', row);
                const isItemSelected = selected.includes(row.consumerID);
                const labelId = `enhanced-table-checkbox-${row.consumerID}`;

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, row.consumerID)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.consumerID}
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
                    <TableCell
                      component="th"
                      id={labelId}
                      scope="row"
                      padding="none"
                    >
                      {index + 1}
                    </TableCell>
                    <TableCell align="left">{row.fullName}</TableCell>
                    <TableCell align="left">
                      {moment(row.createdAt).format(
                        'DD-MM-YYYY HH:mm:ss',
                      )}
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
          count={consumers.length}
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
    </Box>
  );
}
