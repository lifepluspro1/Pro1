// Global variables
let trips = [];
let canceledTrips = [];
const CURRENCY_SYMBOL = '₹';
const KM_RATE = 15; // Default rate per km in INR

// Utility Functions
function formatCurrency(amount) {
    return `${CURRENCY_SYMBOL}${parseFloat(amount).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    })}`;
}

function downloadData(data, filename, format = 'json') {
    let content;
    let mimeType;
    
    switch(format.toLowerCase()) {
        case 'csv':
            content = convertToCSV(data);
            mimeType = 'text/csv';
            filename += '.csv';
            break;
        case 'excel':
            content = convertToExcel(data);
            mimeType = 'application/vnd.ms-excel';
            filename += '.xls';
            break;
        case 'pdf':
            content = convertToPDF(data);
            mimeType = 'application/pdf';
            filename += '.pdf';
            break;
        default:
            content = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
            filename += '.json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function convertToCSV(data) {
    if (!Array.isArray(data)) {
        data = [data];
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

function convertToExcel(data) {
    // Basic Excel XML format
    let excel = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
    excel += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">';
    excel += '<Worksheet ss:Name="Sheet1"><Table>';
    
    // Headers
    const headers = Object.keys(data[0]);
    excel += '<Row>';
    headers.forEach(header => {
        excel += `<Cell><Data ss:Type="String">${header}</Data></Cell>`;
    });
    excel += '</Row>';
    
    // Data
    data.forEach(row => {
        excel += '<Row>';
        headers.forEach(header => {
            const value = row[header];
            const type = typeof value === 'number' ? 'Number' : 'String';
            excel += `<Cell><Data ss:Type="${type}">${value}</Data></Cell>`;
        });
        excel += '</Row>';
    });
    
    excel += '</Table></Worksheet></Workbook>';
    return excel;
}

// Form Handling Functions
document.getElementById('tripForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const customCharge = document.getElementById('customCharge').checked;
    let totalCharge;
    
    if (customCharge) {
        totalCharge = parseFloat(document.getElementById('manualCharge').value);
    } else {
        const distance = parseFloat(document.getElementById('distance').value) || 0;
        const chargePerKm = parseFloat(document.getElementById('chargePerKm').value) || KM_RATE;
        totalCharge = distance * chargePerKm;
    }
    
    const trip = {
        id: Date.now().toString(),
        patientName: document.getElementById('patientName').value,
        patientAge: document.getElementById('patientAge').value,
        patientGender: document.getElementById('patientGender').value,
        patientStatus: document.getElementById('patientStatus').value,
        customStatus: document.getElementById('customStatus').value,
        origin: document.getElementById('origin').value,
        destination: document.getElementById('destination').value,
        driver: document.getElementById('driver').value,
        nursingStaff: document.getElementById('nursingStaff').value,
        ambulance: document.getElementById('ambulance').value,
        ambulanceType: document.getElementById('ambulanceType').value,
        distance: parseFloat(document.getElementById('distance').value) || 0,
        chargePerKm: parseFloat(document.getElementById('chargePerKm').value) || KM_RATE,
        totalCharge: totalCharge,
        paymentType: document.getElementById('paymentType').value,
        paymentStatus: document.getElementById('paymentStatus').value,
        expenses: {
            driver: parseFloat(document.getElementById('driverExpense').value) || 0,
            fuel: parseFloat(document.getElementById('fuelExpense').value) || 0,
            maintenance: parseFloat(document.getElementById('maintenanceExpense').value) || 0,
            nursingStaff: parseFloat(document.getElementById('nursingStaffExpense').value) || 0,
            misc: parseFloat(document.getElementById('miscExpense').value) || 0
        },
        notes: document.getElementById('tripNotes').value,
        date: new Date().toISOString(),
        emergencyContact: document.getElementById('emergencyContact').value,
        medicalCondition: document.getElementById('medicalCondition').value,
        oxygenRequired: document.getElementById('oxygenRequired').checked,
        ventilatorRequired: document.getElementById('ventilatorRequired').checked
    };
    
    trip.totalExpenses = Object.values(trip.expenses).reduce((a, b) => a + b, 0);
    trips.push(trip);
    saveTrips();
    this.reset();
    alert('Trip recorded successfully!');
    updateDashboard();
});

// Enhanced Analytics Functions
function generateAdvancedAnalytics() {
    const timeFrame = document.getElementById('analysisTimeFrame').value;
    const filteredTrips = filterTripsByTimeFrame(trips, timeFrame);
    
    // Financial Metrics
    const totalRevenue = filteredTrips.reduce((sum, trip) => sum + trip.totalCharge, 0);
    const totalExpenses = filteredTrips.reduce((sum, trip) => sum + trip.totalExpenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = (netProfit / totalRevenue * 100) || 0;
    
    // Operational Metrics
    const totalDistance = filteredTrips.reduce((sum, trip) => sum + trip.distance, 0);
    const averageChargePerKm = totalRevenue / totalDistance;
    const tripCount = filteredTrips.length;
    
    // Patient Demographics
    const patientAges = filteredTrips.map(trip => parseInt(trip.patientAge)).filter(age => !isNaN(age));
    const averageAge = patientAges.reduce((a, b) => a + b, 0) / patientAges.length;
    
    const genderDistribution = filteredTrips.reduce((dist, trip) => {
        dist[trip.patientGender] = (dist[trip.patientGender] || 0) + 1;
        return dist;
    }, {});
    
    const html = `
        <div class="analytics-summary">
            <h3>Financial Summary</h3>
            <p>Total Revenue: ${formatCurrency(totalRevenue)}</p>
            <p>Total Expenses: ${formatCurrency(totalExpenses)}</p>
            <p>Net Profit: ${formatCurrency(netProfit)}</p>
            <p>Profit Margin: ${profitMargin.toFixed(2)}%</p>
            
            <h3>Operational Metrics</h3>
            <p>Total Trips: ${tripCount}</p>
            <p>Total Distance: ${totalDistance.toFixed(2)} km</p>
            <p>Average Charge per km: ${formatCurrency(averageChargePerKm)}</p>
            
            <h3>Patient Demographics</h3>
            <p>Average Patient Age: ${averageAge.toFixed(1)} years</p>
            <p>Gender Distribution: ${JSON.stringify(genderDistribution)}</p>
            
            <div class="download-options">
                <button onclick="downloadAnalyticsReport('${timeFrame}', 'pdf')">Download PDF Report</button>
                <button onclick="downloadAnalyticsReport('${timeFrame}', 'excel')">Download Excel Report</button>
                <button onclick="downloadAnalyticsReport('${timeFrame}', 'csv')">Download CSV Report</button>
            </div>
        </div>
    `;
    
    document.getElementById('advancedAnalytics').innerHTML = html;
    
    // Generate various charts
    generateRevenueAnalysisChart(filteredTrips);
    generatePatientDemographicsChart(filteredTrips);
    generateAmbulanceUtilizationChart(filteredTrips);
    generatePaymentAnalysisChart(filteredTrips);
}

function generateRevenueAnalysisChart(filteredTrips) {
    const ctx = document.getElementById('revenueAnalysisChart').getContext('2d');
    const monthlyData = groupTripsByMonth(filteredTrips);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(monthlyData),
            datasets: [
                {
                    label: 'Revenue',
                    data: Object.values(monthlyData).map(data => data.revenue),
                    borderColor: '#36A2EB',
                    fill: false
                },
                {
                    label: 'Expenses',
                    data: Object.values(monthlyData).map(data => data.expenses),
                    borderColor: '#FF6384',
                    fill: false
                },
                {
                    label: 'Profit',
                    data: Object.values(monthlyData).map(data => data.profit),
                    borderColor: '#4BC0C0',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: `Amount (${CURRENCY_SYMBOL})`
                    }
                }
            }
        }
    });
}

// Trip History Functions
function updateDetailedTripHistory() {
    const searchTerm = document.getElementById('tripSearch').value.toLowerCase();
    const filteredTrips = trips.filter(trip => 
        trip.patientName.toLowerCase().includes(searchTerm) ||
        trip.origin.toLowerCase().includes(searchTerm) ||
        trip.destination.toLowerCase().includes(searchTerm) ||
        trip.ambulance.toLowerCase().includes(searchTerm)
    );
    
    const tableHtml = `
        <div class="trip-history-controls">
            <button onclick="downloadAllTrips('pdf')">Download All (PDF)</button>
            <button onclick="downloadAllTrips('excel')">Download All (Excel)</button>
            <button onclick="downloadAllTrips('csv')">Download All (CSV)</button>
        </div>
        <table class="table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Patient Details</th>
                    <th>Trip Details</th>
                    <th>Medical Info</th>
                    <th>Financial Details</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredTrips.map(trip => `
                    <tr>
                        <td>${new Date(trip.date).toLocaleDateString()}</td>
                        <td>
                            <strong>${trip.patientName}</strong><br>
                            Age: ${trip.patientAge}<br>
                            Gender: ${trip.patientGender}<br>
                            Status: ${trip.patientStatus}
                        </td>
                        <td>
                            From: ${trip.origin}<br>
                            To: ${trip.destination}<br>
                            Distance: ${trip.distance} km<br>
                            Ambulance: ${trip.ambulance} (${trip.ambulanceType})
                        </td>
                        <td>
                            Condition: ${trip.medicalCondition}<br>
                            Oxygen: ${trip.oxygenRequired ? 'Yes' : 'No'}<br>
                            Ventilator: ${trip.ventilatorRequired ? 'Yes' : 'No'}<br>
                            Emergency Contact: ${trip.emergencyContact}
                        </td>
                        <td>
                            Charge: ${formatCurrency(trip.totalCharge)}<br>
                            Expenses: ${formatCurrency(trip.totalExpenses)}<br>
                            Payment: ${trip.paymentStatus}
                        </td>
                        <td>
                            <button onclick="downloadTripDetails('${trip.id}', 'pdf')">PDF</button>
                            <button onclick="downloadTripDetails('${trip.id}', 'excel')">Excel</button>
                            <button onclick="viewTripDetails('${trip.id}')">View</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('tripHistoryTable').innerHTML = tableHtml;
}

// Download Functions
function downloadTripDetails(tripId, format) {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    
    const filename = `trip_${trip.patientName}_${new Date(trip.date).toLocaleDateString()}`;
    downloadData(trip, filename, format);
}

function downloadAllTrips(format) {
    const filename = `all_trips_${new Date().toLocaleDateString()}`;
    downloadData(trips, filename, format);
}

function downloadAnalyticsReport(timeFrame, format) {
    const filteredTrips = filterTripsByTimeFrame(trips, timeFrame);
    const filename = `analytics_report_${timeFrame}_${new Date().toLocaleDateString()}`;
    
    const report = generateAnalyticsReport(filteredTrips);
    downloadData(report, filename, format);
}

// Initialize the application
function initializeApp() {
    loadTrips();
    updateDetailedTripHistory();
    generateAdvancedAnalytics();
    updateDashboard();
    
    // Set up event listeners
    document.getElementById('tripSearch').addEventListener('input', updateDetailedTripHistory);
    document.getElementById('analysisTimeFrame').addEventListener('change', generateAdvancedAnalytics);
    document.getElementById('customCharge').addEventListener('change', function() {
        document.getElementById('automaticChargeFields').style.display = this.checked ? 'none' : 'block';
        document.getElementById('manualChargeField').style.display = this.checked ? 'block' : 'none';
    });
}

// ... (continuing from previous code)

// Call initializeApp when the page loads
window.addEventListener('load', initializeApp);

// Additional Analytics and Reporting Functions
function generateAnalyticsReport(filteredTrips) {
    return {
        summary: {
            totalTrips: filteredTrips.length,
            totalRevenue: filteredTrips.reduce((sum, trip) => sum + trip.totalCharge, 0),
            totalExpenses: filteredTrips.reduce((sum, trip) => sum + trip.totalExpenses, 0),
            totalDistance: filteredTrips.reduce((sum, trip) => sum + trip.distance, 0)
        },
        ambulanceMetrics: generateAmbulanceMetrics(filteredTrips),
        patientMetrics: generatePatientMetrics(filteredTrips),
        financialMetrics: generateFinancialMetrics(filteredTrips),
        operationalMetrics: generateOperationalMetrics(filteredTrips)
    };
}

function generateAmbulanceMetrics(trips) {
    const ambulanceUsage = {};
    const typeUsage = {};
    
    trips.forEach(trip => {
        ambulanceUsage[trip.ambulance] = (ambulanceUsage[trip.ambulance] || 0) + 1;
        typeUsage[trip.ambulanceType] = (typeUsage[trip.ambulanceType] || 0) + 1;
    });
    
    return {
        usageByVehicle: ambulanceUsage,
        usageByType: typeUsage,
        averageDistancePerTrip: trips.reduce((sum, trip) => sum + trip.distance, 0) / trips.length
    };
}

function generatePatientMetrics(trips) {
    const ageGroups = {
        'Under 18': 0,
        '18-30': 0,
        '31-50': 0,
        '51-70': 0,
        'Over 70': 0
    };
    
    trips.forEach(trip => {
        const age = parseInt(trip.patientAge);
        if (age < 18) ageGroups['Under 18']++;
        else if (age <= 30) ageGroups['18-30']++;
        else if (age <= 50) ageGroups['31-50']++;
        else if (age <= 70) ageGroups['51-70']++;
        else ageGroups['Over 70']++;
    });
    
    return {
        ageDistribution: ageGroups,
        genderDistribution: trips.reduce((dist, trip) => {
            dist[trip.patientGender] = (dist[trip.patientGender] || 0) + 1;
            return dist;
        }, {}),
        statusDistribution: trips.reduce((dist, trip) => {
            dist[trip.patientStatus] = (dist[trip.patientStatus] || 0) + 1;
            return dist;
        }, {}),
        medicalRequirements: {
            oxygenRequired: trips.filter(t => t.oxygenRequired).length,
            ventilatorRequired: trips.filter(t => t.ventilatorRequired).length
        }
    };
}

function generateFinancialMetrics(trips) {
    const revenue = trips.reduce((sum, trip) => sum + trip.totalCharge, 0);
    const expenses = trips.reduce((sum, trip) => sum + trip.totalExpenses, 0);
    const profit = revenue - expenses;
    
    return {
        revenue,
        expenses,
        profit,
        profitMargin: (profit / revenue * 100) || 0,
        paymentStatus: trips.reduce((status, trip) => {
            status[trip.paymentStatus] = (status[trip.paymentStatus] || 0) + 1;
            return status;
        }, {}),
        averageChargePerTrip: revenue / trips.length,
        expenseBreakdown: trips.reduce((breakdown, trip) => {
            Object.entries(trip.expenses).forEach(([category, amount]) => {
                breakdown[category] = (breakdown[category] || 0) + amount;
            });
            return breakdown;
        }, {})
    };
}

function generateOperationalMetrics(trips) {
    const tripsByMonth = groupTripsByMonth(trips);
    const distances = trips.map(trip => trip.distance);
    
    return {
        monthlyTrends: tripsByMonth,
        averageDistance: distances.reduce((a, b) => a + b, 0) / distances.length,
        maxDistance: Math.max(...distances),
        minDistance: Math.min(...distances),
        routeFrequency: trips.reduce((freq, trip) => {
            const route = `${trip.origin} to ${trip.destination}`;
            freq[route] = (freq[route] || 0) + 1;
            return freq;
        }, {})
    };
}

// Helper Functions
function groupTripsByMonth(trips) {
    return trips.reduce((monthly, trip) => {
        const month = new Date(trip.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthly[month]) {
            monthly[month] = {
                revenue: 0,
                expenses: 0,
                profit: 0,
                tripCount: 0,
                totalDistance: 0
            };
        }
        monthly[month].revenue += trip.totalCharge;
        monthly[month].expenses += trip.totalExpenses;
        monthly[month].profit += (trip.totalCharge - trip.totalExpenses);
        monthly[month].tripCount++;
        monthly[month].totalDistance += trip.distance;
        return monthly;
    }, {});
}

function generatePDFReport(data) {
    // Implementation would require a PDF library like pdfmake
    // This is a placeholder for the PDF generation logic
    return "PDF Generation placeholder";
}

// Export functionality
function exportDatabase() {
    const exportData = {
        trips: trips,
        canceledTrips: canceledTrips,
        settings: {
            kmRate: KM_RATE,
            currency: CURRENCY_SYMBOL
        },
        exportDate: new Date().toISOString(),
        version: "1.0.0"
    };
    
    downloadData(exportData, 'ambulance_management_system_backup', 'json');
}

// Import functionality
function importDatabase(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            if (validateImportData(importData)) {
                trips = importData.trips;
                canceledTrips = importData.canceledTrips;
                saveTrips();
                saveCanceledTrips();
                initializeApp();
                alert('Data imported successfully!');
            } else {
                alert('Invalid import file format!');
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function validateImportData(data) {
    return data && Array.isArray(data.trips) && Array.isArray(data.canceledTrips);
}

// Settings Management
function updateSettings(settings) {
    if (settings.kmRate) KM_RATE = parseFloat(settings.kmRate);
    if (settings.currency) CURRENCY_SYMBOL = settings.currency;
    localStorage.setItem('settings', JSON.stringify({ kmRate: KM_RATE, currency: CURRENCY_SYMBOL }));
}

function loadSettings() {
    const settings = localStorage.getItem('settings');
    if (settings) {
        const parsedSettings = JSON.parse(settings);
        KM_RATE = parsedSettings.kmRate || KM_RATE;
        CURRENCY_SYMBOL = parsedSettings.currency || CURRENCY_SYMBOL;
    }
}

// Initialize settings when the application loads
loadSettings();
