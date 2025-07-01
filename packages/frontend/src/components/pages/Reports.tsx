import { useQuery } from '@apollo/client';
import { PictureAsPdf } from '@mui/icons-material'; // Import MUI icon
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import * as d3 from 'd3';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Ensure autoTable is imported
import { useEffect, useRef, useState } from 'react';
import { GET_INVOICES, getSettings } from '../../api/apollo';
export type Settings = {
  getSettings: {
    m3price: GLfloat;
    village: string;
    phone: string;
    email: string;
    deadline: string;
    subscription: string;
    tax: string;
  };
};

type Invoice = {
  invoiceID: string;
  createdAt: string;
  amount: number;
  isPaid: boolean;
  isPrinted: boolean;
  consumer: {
    consumerID: string;
    fullName: string;
  };
  record: {
    recordID: string;
    period: string;
    recordDate: string;
    nextRecordDate: string;
    oldRecord: number;
    newRecord: number;
  };
  counter: {
    counterID: string;
    status: string;
  };
  debt: {
    isPaid: boolean;
    amount: string;
    createdAt: string;
    invoiceID: string;
  };
};

function Reports() {
  const { refetch, loading, error, data } = useQuery(GET_INVOICES);
  const {
    loading: loadingSettings,
    error: errorSettings,
    data: dataSettings,
  } = useQuery<Settings>(getSettings);
  console.log('==>Settings', dataSettings);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() - 1))
      .toISOString()
      .split('T')[0],
  ); // Default to one year before today
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0],
  ); // Default to today's date
  const [period, setPeriod] = useState('');
  const [searchName, setSearchName] = useState(''); // Add state for consumer name search
  const [suggestions, setSuggestions] = useState<string[]>([]); // State for autocomplete suggestions
  const chartRef = useRef(null);

  const periodOptions = ['Jan - Mar', 'Apr - Jun', 'Jul - Sep', 'Oct - Dec']; // Define period options

  console.log('==>data', data);
  // Filter invoices based on date range and period
  const filteredInvoices =
    data?.invoices?.filter((invoice: Invoice) => {
      const invoiceDate = new Date(invoice.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const matchesDateRange =
        (start &&
          end &&
          invoiceDate >= start &&
          invoiceDate <= new Date(end.setHours(23, 59, 59, 999))) || // Ensure both start and end are set
        (!start && !end) || // No date range set
        (start && !end && invoiceDate >= start) || // Only start date set
        (!start &&
          end &&
          invoiceDate <= new Date(end.setHours(23, 59, 59, 999))); // Only end date set

      const matchesPeriod = !period || invoice.record.period === period;
      const matchesName =
        !searchName ||
        invoice.consumer.fullName
          .toLowerCase()
          .includes(searchName.toLowerCase());

      return matchesDateRange && matchesPeriod && matchesName;
    }) || [];

  // Calculate revenue, debt, and invoice counts
  const calculateStats = () => {
    let totalRevenue = 0;
    let totalDebt = 0;
    let paidInvoices = 0;
    let unpaidInvoices = 0;
    let partiallyPaidInvoices = 0;
    let fullyPaidWithDebtAmount = 0;
    let totalSubscriptionAndTax = 0;

    const subscription = parseFloat(
      dataSettings?.getSettings?.subscription || '0',
    );
    const tax = parseFloat(dataSettings?.getSettings?.tax || '0');

    filteredInvoices.forEach((invoice: Invoice) => {
      const amount = parseFloat(invoice.amount.toString()) || 0;
      const debtAmount = parseFloat(invoice.debt?.amount || '0');

      if (invoice.isPaid && (!invoice.debt || invoice.debt.isPaid === true)) {
        totalRevenue += amount;
        paidInvoices++;
        totalSubscriptionAndTax += subscription + tax;
      } else if (invoice.isPaid && invoice.debt?.isPaid === false) {
        const paidAmount = amount - debtAmount;
        totalRevenue += paidAmount;
        totalDebt += debtAmount;
        partiallyPaidInvoices++;
      } else if (!invoice.isPaid && invoice.debt?.isPaid === false) {
        totalDebt += debtAmount;
        unpaidInvoices++;
      } else if (!invoice.isPaid) {
        unpaidInvoices++;
      }
    });

    const grandTotal = totalRevenue + totalSubscriptionAndTax; // Calculate Grand Total

    return {
      totalRevenue,
      totalDebt,
      paidInvoices,
      unpaidInvoices,
      partiallyPaidInvoices,
      fullyPaidWithDebtAmount,
      totalSubscriptionAndTax,
      grandTotal, // Return Grand Total
    };
  };

  const generatePDF = async () => {
    const {
      totalRevenue,
      totalDebt,
      paidInvoices,
      unpaidInvoices,
      partiallyPaidInvoices,
      totalSubscriptionAndTax,
      grandTotal,
    } = calculateStats();
    const grandTotalWithDebt = grandTotal + totalDebt; // Calculate Grand Total with debts
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString();

    // Add title
    doc.setFontSize(18);
    doc.text('Rapport des Statistiques', 105, 20, {
      align: 'center',
    });

    // Add date and consumer name
    doc.setFontSize(12);
    doc.text(`Date du Rapport: ${reportDate}`, 105, 30, { align: 'center' });
    doc.text(
      `Consommateur: ${searchName || 'Tous les Consommateurs'}`,
      105,
      37,
      { align: 'center' },
    );
    if (startDate || endDate) {
      doc.text(
        `Période: ${startDate || 'Début'} - ${
          endDate || new Date().toLocaleDateString()
        }`,
        105,
        44,
        { align: 'center' },
      );
    }

    autoTable(doc, {
      startY: 50,
      head: [['Statistique', 'Valeur']],
      body: [
        ['Revenu Total', `${totalRevenue.toFixed(2)} DA`],
        ['Dette Totale', `${totalDebt.toFixed(2)} DA`],
        ['Factures Payées', `${paidInvoices}`],
        ['Factures Non Payées', `${unpaidInvoices}`],
        [
          'Abonnement et Taxe de collecte des déchets ménagers',
          `${totalSubscriptionAndTax.toFixed(2)} DA`,
        ],
        ['Grand Total', `${grandTotal.toFixed(2)} DA`],
        ['Grand Total avec dettes', `${grandTotalWithDebt.toFixed(2)} DA`], // Add Grand Total with debts
      ],
      theme: 'grid',
      styles: { fontSize: 12, cellPadding: 3 },
      headStyles: { fillColor: [220, 220, 220] },
    });

    // Calculate the starting Y position for the graphs
    const tableEndY = doc?.lastAutoTable?.finalY || 0;
    const startY = tableEndY + 20; // Add 20 units of space after the table

    // Convert SVGs to images and add them to the PDF
    const addChartToPDF = async (
      svgId: string,
      title: string | string[],
      x: number,
      y: number,
      maxWidth: number,
    ) => {
      const svgElement = document.getElementById(svgId);
      if (!svgElement) {
        console.error(`SVG element with ID "${svgId}" not found.`);
        return;
      }

      try {
        const svgData = new XMLSerializer().serializeToString(svgElement);

        // Handle special characters by encoding the SVG data
        const encodedSvgData = encodeURIComponent(svgData);
        const imgSrc = `data:image/svg+xml;charset=utf-8,${encodedSvgData}`;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.src = imgSrc;

        await new Promise((resolve, reject) => {
          img.onload = () => {
            // Maintain aspect ratio and increase resolution
            const aspectRatio = img.width / img.height;
            const width = maxWidth;
            const height = width / aspectRatio;

            const scaleFactor = 6; // Increase resolution by scaling
            canvas.width = width * scaleFactor;
            canvas.height = height * scaleFactor;

            ctx?.scale(scaleFactor, scaleFactor);
            ctx?.drawImage(img, 0, 0, width, height);

            // Set font size to 14px
            if (ctx) {
              ctx.font = `bold 14px sans-serif`;
            }
            resolve(null);
          };
          img.onerror = (err) => {
            console.error(`Error loading image for SVG ID "${svgId}":`, err);
            reject(err);
          };
        });

        const imgData = canvas.toDataURL('image/png');

        // Add title above the chart
        doc.setFontSize(14); // Set font size for title
        doc.text(title, x + maxWidth / 2, y - 5, { align: 'center' });

        // Add the chart image
        doc.addImage(
          imgData,
          'PNG',
          x,
          y,
          maxWidth,
          maxWidth / (img.width / img.height),
        );
      } catch (error) {
        console.error(`Error processing SVG ID "${svgId}":`, error);
        throw error;
      }
    };

    try {
      // Add graphs in one line with smaller dimensions
      const chartWidth = 50; // Smaller width for charts
      const chartSpacing = 10; // Spacing between charts
      const rowY = startY;

      await addChartToPDF(
        'revenue-debt-chart',
        'Revenu et Dette',
        14,
        rowY,
        chartWidth,
      );
      await addChartToPDF(
        'invoice-pie-chart',
        'Répartition des Factures',
        14 + chartWidth + chartSpacing,
        rowY,
        chartWidth,
      );
      await addChartToPDF(
        'water-consumption-chart',
        "Consommation d'Eau",
        14 + 2 * (chartWidth + chartSpacing),
        rowY,
        chartWidth,
      );

      // Save the PDF
      doc.save('rapport_statistiques.pdf');
      console.log('PDF successfully generated and saved.');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(
        'Une erreur est survenue lors de la génération du PDF. Veuillez vérifier les graphiques.',
      );
    }
  };

  const renderRevenueDebtChart = () => {
    const { totalRevenue, totalDebt } = calculateStats(); // Use calculated stats

    const chartData = [
      { label: 'Revenu', value: totalRevenue },
      { label: 'Dette', value: totalDebt },
    ].filter((d) => d.value > 0); // Filter out entries with value 0

    const width = 300; // Increased width to accommodate 6-digit values
    const height = 150; // Reduced height
    const margin = { top: 20, right: 20, bottom: 60, left: 40 }; // Adjusted margins

    const svg = d3
      .select('#revenue-debt-chart')
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove(); // Clear previous chart

    const x = d3
      .scaleBand()
      .domain(chartData.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d: { value: number }) => d.value) || 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '14px'); // Set font size to 14px

    svg
      .selectAll('.bar')
      .data(chartData)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d: { label: string }) => x(d.label) || 0)
      .attr('y', (d: { value: number }) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d: { value: number }) => y(0) - y(d.value))
      .attr('fill', 'steelblue');

    // Add values on top of each bar
    svg
      .selectAll('.bar-label')
      .data(chartData)
      .join('text')
      .attr('class', 'bar-label')
      .attr(
        'x',
        (d: { label: string }) => (x(d.label) || 0) + x.bandwidth() / 2,
      )
      .attr('y', (d: { value: number }) => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px') // Set font size to 14px
      .text((d: { value: number }) => `${d.value} DA`);
  };

  const renderInvoicePieChart = () => {
    const { paidInvoices, partiallyPaidInvoices, unpaidInvoices } =
      calculateStats();

    const chartData = [
      { label: 'P', value: paidInvoices },
      { label: 'PP', value: partiallyPaidInvoices },
      { label: 'NP', value: unpaidInvoices },
    ].filter((d) => d.value > 0); // Filter out entries with value 0

    const width = 200; // Reduced width
    const height = 150; // Reduced height
    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select('#invoice-pie-chart')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', '0 0 200 200')
      .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.selectAll('*').remove(); // Clear previous chart

    const color = d3
      .scaleOrdinal<string>()
      .domain(chartData.map((d) => d.label))
      .range(['#4CAF50', '#FFC107', '#FF7043']); // Green for paid, yellow for partially paid, orange for unpaid

    const pie = d3
      .pie<{ label: string; value: number }>()
      .value((d: { value: any }) => d.value);
    const data_ready = pie(chartData);

    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(0) // Full pie chart (no hole)
      .outerRadius(radius);

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    g.selectAll('path')
      .data(data_ready)
      .join('path')
      .attr('d', arc)
      .attr('fill', (d: { data: { label: any } }) => color(d.data.label))
      .attr('stroke', '#FFFFFF') // White stroke for separation
      .style('stroke-width', '2px');

    // Use sans-serif font for labels
    g.selectAll('text')
      .data(data_ready)
      .join('text')
      .text(
        (d: { data: { label: any; value: any } }) =>
          `${d.data.label}: ${d.data.value}`,
      )
      .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px') // Set font size to 14px
      .style('font-family', 'sans-serif') // Use sans-serif font
      .style('fill', '#212121'); // Dark gray text for readability
  };

  const renderWaterConsumptionChart = () => {
    const consumptionData = filteredInvoices.reduce(
      (acc: Record<string, number>, invoice: Invoice) => {
        const period = invoice.record.period;
        const consumption = invoice.record.newRecord - invoice.record.oldRecord;
        acc[period] = (acc[period] || 0) + consumption; // Aggregate consumption by period
        return acc;
      },
      {},
    );

    const chartData = Object.entries(consumptionData).map(
      ([period, consumption]) => ({
        period,
        consumption: consumption as number, // Explicitly cast consumption to number
      }),
    );

    const width = 300; // Increased width to accommodate 6-digit values
    const height = 150; // Reduced height
    const margin = { top: 20, right: 20, bottom: 60, left: 40 }; // Adjusted margins

    const svg = d3
      .select('#water-consumption-chart')
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove(); // Clear previous chart

    const x = d3
      .scaleBand()
      .domain(chartData.map((d) => d.period))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(chartData, (d: { consumption: number }) => d.consumption) || 0,
      ])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '14px'); // Set font size to 14px

    svg
      .selectAll('.bar')
      .data(chartData)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d: { period: any }) => x(d.period) || 0)
      .attr('y', (d: { consumption: any }) => y(d.consumption))
      .attr('width', x.bandwidth())
      .attr('height', (d: { consumption: any }) => y(0) - y(d.consumption))
      .attr('fill', 'teal');

    // Add values on top of each bar
    svg
      .selectAll('.bar-label')
      .data(chartData)
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', (d: { period: any }) => (x(d.period) || 0) + x.bandwidth() / 2)
      .attr('y', (d: { consumption: any }) => y(d.consumption) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px') // Set font size to 14px
      .text((d: { consumption: any }) => `${d.consumption} m³`);
  };

  useEffect(() => {
    renderRevenueDebtChart();
    renderInvoicePieChart();
    renderWaterConsumptionChart();
  }, [filteredInvoices]); // Update graphs whenever filteredInvoices changes

  useEffect(() => {
    if (searchName && data?.invoices) {
      const uniqueNames: string[] = Array.from(
        new Set(
          data.invoices
            .map((invoice: Invoice) => invoice.consumer.fullName)
            .filter((name: string) =>
              name.toLowerCase().includes(searchName.toLowerCase()),
            ),
        ),
      );
      setSuggestions(uniqueNames); // Explicitly typed as string[]
    } else {
      setSuggestions([]);
    }
  }, [searchName, data]);

  useEffect(() => {
    refetch(); // Refresh data when the component re-renders
  }, []); // Empty dependency array ensures it runs only on initial render

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur lors du chargement des données</div>;

  const {
    totalRevenue = 0,
    totalDebt = 0,
    paidInvoices = 0,
    unpaidInvoices = 0,
    partiallyPaidInvoices = 0,
    totalSubscriptionAndTax = 0,
    grandTotal = 0,
  } = calculateStats();

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
        padding: '20px',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Rapport des Statistiques
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        <strong>Date du Rapport:</strong> {new Date().toLocaleDateString()}
      </Typography>
      {searchName ? (
        <Typography variant="subtitle1" gutterBottom>
          <strong>Consommateur:</strong> {searchName}
        </Typography>
      ) : (
        <Typography variant="subtitle1" gutterBottom>
          <strong>Consommateur:</strong> Tous les Consommateurs
        </Typography>
      )}
      {(startDate || endDate) && (
        <Typography variant="subtitle1" gutterBottom>
          <strong>Période:</strong> {startDate || 'Début'} -{' '}
          {endDate || new Date().toLocaleDateString()}
        </Typography>
      )}

      <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Date de début"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Date de fin"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Période</InputLabel>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              label="Période"
            >
              <MenuItem value="">Tous</MenuItem>
              {periodOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              label="Nom du consommateur"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                if (e.target.value && data?.invoices) {
                  const uniqueNames = Array.from(
                    new Set(
                      data.invoices
                        .map((invoice: Invoice) => invoice.consumer.fullName)
                        .filter((name: string) =>
                          name
                            .toLowerCase()
                            .includes(e.target.value.toLowerCase()),
                        ),
                    ),
                  );
                  setSuggestions(uniqueNames as string[]);
                } else {
                  setSuggestions([]);
                }
              }}
              placeholder="Rechercher par nom"
              autoComplete="off" // Disable native HTML autocomplete
            />
            {suggestions.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '100%', // Position dropdown below the input field
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  zIndex: 1000,
                  maxHeight: '150px',
                  overflowY: 'auto',
                  fontFamily: 'inherit', // Use the app's font family
                }}
              >
                {suggestions.map((name) => (
                  <Box
                    key={name}
                    sx={{
                      padding: '8px',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f0f0f0' },
                    }}
                    onClick={() => {
                      setSearchName(name);
                      setSuggestions([]);
                    }}
                  >
                    {name}
                  </Box>
                ))}
              </Box>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12}></Grid>
      </Grid>

      {filteredInvoices.length > 0 ? (
        <>
          <Box sx={{ marginBottom: '20px' }}>
            <Typography variant="h5" gutterBottom>
              Statistiques
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Statistique</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Valeur</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Revenu Total</TableCell>
                    <TableCell align="right">
                      {totalRevenue.toFixed(2)} DA
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Dette Totale</TableCell>
                    <TableCell align="right">
                      {totalDebt.toFixed(2)} DA
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Factures Payées</TableCell>
                    <TableCell align="right">{paidInvoices}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Factures Non Payées</TableCell>
                    <TableCell align="right">{unpaidInvoices}</TableCell>
                  </TableRow>
                  {partiallyPaidInvoices > 0 && (
                    <TableRow>
                      <TableCell>Factures Partiellement Payées</TableCell>
                      <TableCell align="right">
                        {partiallyPaidInvoices}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell>
                      Abonnement et Taxe de collecte des déchets ménagers
                    </TableCell>
                    <TableCell align="right">
                      {totalSubscriptionAndTax.toFixed(2)} DA
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Grand Total</TableCell>
                    <TableCell align="right">
                      {grandTotal.toFixed(2)} DA
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Grand Total avec dettes</TableCell>
                    <TableCell align="right">
                      {(grandTotal + totalDebt).toFixed(2)} DA
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '20px',
              marginBottom: '20px',
            }}
          >
            <Box sx={{ textAlign: 'center', flex: '1 1 30%' }}>
              <svg id="revenue-debt-chart" width="100%" height="200"></svg>
              <Typography
                variant="subtitle1"
                align="center"
                sx={{ marginTop: '10px' }}
              >
                Revenu et Dette
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: '1 1 30%' }}>
              <svg
                id="invoice-pie-chart"
                width="100%"
                height="200"
                viewBox="0 0 200 200"
                preserveAspectRatio="xMidYMid meet"
              ></svg>
              <Typography
                variant="subtitle1"
                align="center"
                sx={{ marginTop: '10px' }}
              >
                Répartition des Factures
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: '1 1 30%' }}>
              <svg id="water-consumption-chart" width="100%" height="200"></svg>
              <Typography
                variant="subtitle1"
                align="center"
                sx={{ marginTop: '10px' }}
              >
                Consommation d'Eau
              </Typography>
            </Box>
          </Box>
        </>
      ) : (
        <Box sx={{ marginTop: '20px' }}>
          <Typography variant="h6">Aucune donnée disponible</Typography>
        </Box>
      )}

      <Button
        variant="contained"
        onClick={generatePDF}
        sx={{ marginTop: '20px', backgroundColor: 'rgb(25, 118, 210)' }}
        startIcon={<PictureAsPdf />} // Add icon to the button
      >
        Exporter
      </Button>
    </Box>
  );
}

export default Reports;
