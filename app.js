// Global variables
let trips = [];
let canceledTrips = [];

// Function to show/hide sections
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

// Function to handle form submission
document.getElementById('tripForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const trip = {
        patientName: document.getElementById('patientName').value,
        patientStatus: document.getElementById('patientStatus').value,
        customStatus: document.getElementById('customStatus').value,
        origin: document.getElementById('origin').value,
        destination: document.getElementById('destination').value,
        driver: document.getElementById('driver').value,
        nursingStaff: document.getElementById('nursingStaff').value,
        ambulance: document.getElementById('ambulance').value,
        distance: parseFloat(document.getElementById('distance').value) || 0,
        charge: parseFloat(document.getElementById('charge').value) || 0,
        totalCharge: parseFloat(document.getElementById('totalCharge').value),
        paymentType: document.getElementById('paymentType').value,
        expenses: {
            driver: parseFloat(document.getElementById('driverExpense').value) || 0,
            fuel: parseFloat(document.getElementById('fuelExpense').value) || 0,
            maintenance: parseFloat(document.getElementById('maintenanceExpense').value) || 0,
            nursingStaff: parseFloat(document.getElementById('nursingStaffExpense').value) || 0,
            misc: parseFloat(document.getElementById('miscExpense').value) || 0
        },
        totalExpenses: parseFloat(document.getElementById('totalExpenses').value),
        date: new Date().toISOString()
    };
    trips.push(trip);
    saveTrips();
    this.reset();
    alert('Trip recorded successfully!');
    updateDashboard();
    updateTripHistory();
});

// Function to cancel a trip
function cancelTrip() {
    const canceledTrip = {
        patientName: document.getElementById('patientName').value,
        origin: document.getElementById('origin').value,
        destination: document.getElementById('destination').value,
        date: new Date().toISOString()
    };
    canceledTrips.push(canceledTrip);
    saveCanceledTrips();
    document.getElementById('tripForm').reset();
    alert('Trip canceled and recorded.');
}

// Function to calculate total charge
document.getElementById('distance').addEventListener('input', calculateTotalCharge);
document.getElementById('charge').addEventListener('input', calculateTotalCharge);
document.getElementById('totalCharge').addEventListener('input', calculateTotalCharge);

function calculateTotalCharge() {
    const distance = parseFloat(document.getElementById('distance').value) || 0;
    const charge = parseFloat(document.getElementById('charge').value) || 0;
    let totalCharge = parseFloat(document.getElementById('totalCharge').value) || 0;
    
    if (distance && charge) {
        totalCharge = distance * charge;
    }
    
    document.getElementById('totalCharge').value = totalCharge.toFixed(2);
}

// Function to calculate total expenses
document.querySelectorAll('.expense-input').forEach(input => {
    input.addEventListener('input', calculateTotalExpenses);
});

function calculateTotalExpenses() {
    let total = 0;
    document.querySelectorAll('.expense-input').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('totalExpenses').value = total.toFixed(2);
}

// Function to save trips to local storage
function saveTrips() {
    localStorage.setItem('trips', JSON.stringify(trips));
}

// Function to save canceled trips to local storage
function saveCanceledTrips() {
    localStorage.setItem('canceledTrips', JSON.stringify(canceledTrips));
}

// Function to load trips from local storage
function loadTrips() {
    const savedTrips = localStorage.getItem('trips');
    if (savedTrips) {
        trips = JSON.parse(savedTrips);
    }
    const savedCanceledTrips = localStorage.getItem('canceledTrips');
    if (savedCanceledTrips) {
        canceledTrips = JSON.parse(savedCanceledTrips);
    }
}

// Show/hide custom status input based on selection
document.getElementById('patientStatus').addEventListener('change', function() {
    const customStatusInput = document.getElementById('customStatus');
    if (this.value === 'custom') {
        customStatusInput.style.display = 'block';
        customStatusInput.required = true;
    } else {
        customStatusInput.style.display = 'none';
        customStatusInput.required = false;
    }
});

// Financial Analysis Functions
function generateFinancialAnalysis() {
    const timeFrame = document.getElementById('analysisTimeFrame').value;
    let startDate, endDate;
    
    if (timeFrame === 'custom') {
        startDate = new Date(document.getElementById('startDate').value);
        endDate = new Date(document.getElementById('endDate').value);
    } else {
        [startDate, endDate] = getDateRange(timeFrame);
    }
    
    const filteredTrips = filterTripsByDateRange(trips, startDate, endDate);
    
    const totalRevenue = filteredTrips.reduce((sum, trip) => sum + trip.totalCharge, 0);
    const totalExpenses = filteredTrips.reduce((sum, trip) => sum + trip.totalExpenses, 0);
    const netProfit = totalRevenue - totalExpenses;

    const summaryHtml = `
        <p><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
        <p><strong>Total Expenses:</strong> ₹${totalExpenses.toFixed(2)}</p>
        <p><strong>Net Profit:</strong> ₹${netProfit.toFixed(2)}</p>
    `;
    document.getElementById('financialSummary').innerHTML = summaryHtml;

    generateExpenditureChart(filteredTrips);
    generateCostRevenueChart(filteredTrips);
    generateProfitabilityChart(filteredTrips);
    generateExpenseTrendChart(filteredTrips);
}

function getDateRange(timeFrame) {
    const now = new Date();
    const startDate = new Date();
    
    switch(timeFrame) {
        case 'daily':
            startDate.setDate(now.getDate() - 1);
            break;
        case 'weekly':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'monthly':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'yearly':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
    }
    
    return [startDate, now];
}

function filterTripsByDateRange(trips, startDate, endDate) {
    return trips.filter(trip => {
        const tripDate = new Date(trip.date);
        return tripDate >= startDate && tripDate <= endDate;
    });
}

function generateExpenditureChart(trips) {
    const ctx = document.getElementById('expenditureChart').getContext('2d');
    const expenseCategories = ['driver', 'fuel', 'maintenance', 'nursingStaff', 'misc'];
    const expenseData = expenseCategories.map(category => 
        trips.reduce((sum, trip) => sum + trip.expenses[category], 0)
    );

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Driver', 'Fuel', 'Maintenance', 'Nursing Staff', 'Miscellaneous'],
            datasets: [{
                data: expenseData,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        }
    });
}

function generateCostRevenueChart(trips) {
    const ctx = document.getElementById('costRevenueChart').getContext('2d');
    const labels = trips.map(trip => new Date(trip.date).toLocaleDateString());
    const revenues = trips.map(trip => trip.totalCharge);
    const costs = trips.map(trip => trip.totalExpenses);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenues,
                    borderColor: '#36A2EB',
                    fill: false
                },
                {
                    label: 'Cost',
                    data: costs,
                    borderColor: '#FF6384',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    }
                }
            }
        }
    });
}

function generateProfitabilityChart(trips) {
    const ctx = document.getElementById('profitabilityChart').getContext('2d');
    const labels = trips.map(trip => new Date(trip.date).toLocaleDateString());
    const profits = trips.map(trip => trip.totalCharge - trip.totalExpenses);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Profit',
                data: profits,
                backgroundColor: profits.map(profit => profit >= 0 ? '#4BC0C0' : '#FF6384')
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Profit (₹)'
                    }
                }
            }
        }
    });
}

function generateExpenseTrendChart(trips) {
    const ctx = document.getElementById('expenseTrendChart').getContext('2d');
    const labels = trips.map(trip => new Date(trip.date).toLocaleDateString());
    const expenseCategories = ['driver', 'fuel', 'maintenance', 'nursingStaff', 'misc'];
    const datasets = expenseCategories.map(category => ({
        label: category.charAt(0).toUpperCase() + category.slice(1),
        data: trips.map(trip => trip.expenses[category]),
        borderColor: getRandomColor(),
        fill: false
    }));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Expense (₹)'
                    }
                }
            }
        }
    });
}

function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
}

function calculateRevenueDistribution() {
    const allocation = parseFloat(document.getElementById('revenueAllocation').value) / 100;
    const totalRevenue = trips.reduce((sum, trip) => sum + trip.totalCharge, 0);
    const distributedAmount = totalRevenue * allocation;
    const remainingAmount = totalRevenue - distributedAmount;

    const resultHtml = `
        <p><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
        <p><strong>Distributed Amount (${(allocation * 100).toFixed(2)}%):</strong> ₹${distributedAmount.toFixed(2)}</p>
        <p><strong>Remaining Amount:</strong> ₹${remainingAmount.toFixed(2)}</p>
    `;
    document.getElementById('revenueDistributionResult').innerHTML = resultHtml;
}

// Data Analytics Functions
function updateTripHistory() {
    const tableHtml = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Origin</th>
                    <th>Destination</th>
                    <th>Total Charge</th>
                </tr>
            </thead>
            <tbody>
                ${trips.map(trip => `
                    <tr>
                        <td>${new Date(trip.date).toLocaleDateString()}</td>
                        <td>${trip.patientName}</td>
                        <td>${trip.origin}</td>
                        <td>${trip.destination}</td>
                        <td>₹${trip.totalCharge.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('tripHistoryTable').innerHTML = tableHtml;
}

function generatePatientDemographicsChart() {
    const ctx = document.getElementById('patientDemographicsChart').getContext('2d');
    const statusCounts = trips.reduce((counts, trip) => {
        counts[trip.patientStatus] = (counts[trip.patientStatus] || 0) + 1;
        return counts;
    }, {});

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        }
    });
}

function generateTripFrequencyChart() {
    const ctx = document.getElementById('tripFrequencyChart').getContext('2d');
    const tripDates = trips.map(trip => new Date(trip.date).toLocaleDateString());
    const frequencyCounts = tripDates.reduce((counts, date) => {
        counts[date] = (counts[date] || 0) + 1;
        return counts;
    }, {});

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(frequencyCounts),
            datasets: [{
                label: 'Number of Trips',
                data: Object.values(frequencyCounts),
                backgroundColor: '#36A2EB'
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Trips'
                    }
                }
            }
        }
    });
}

// Dashboard Functions
function updateDashboard() {
    document.getElementById('totalTripsCount').textContent = trips.length;
    
    const totalRevenue = trips.reduce((sum, trip) => sum + trip.totalCharge, 0);
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toFixed(2)}`;
    
    const totalExpenses = trips.reduce((sum, trip) => sum + trip.totalExpenses, 0);
    document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toFixed(2)}`;
    
    const netProfit = totalRevenue - totalExpenses;
    document.getElementById('netProfit').textContent = `₹${netProfit.toFixed(2)}`;

    generateRevenueTrendChart();
    generateAmbulanceUtilizationChart();
    generatePatientStatusChart();
    generatePaymentTypeChart();
}

function generateRevenueTrendChart() {
    const ctx = document.getElementById('revenueTrendChart').getContext('2d');
    const labels = trips.map(trip => new Date(trip.date).toLocaleDateString());
    const revenues = trips.map(trip => trip.totalCharge);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: revenues,
                borderColor: '#36A2EB',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Revenue (₹)'
                    }
                }
            }
        }
    });
}

function generateAmbulanceUtilizationChart() {
    const ctx = document.getElementById('ambulanceUtilizationChart').getContext('2d');
    const ambulanceCounts = trips.reduce((counts, trip) => {
        counts[trip.ambulance] = (counts[trip.ambulance] || 0) + 1;
        return counts;
    }, {});

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(ambulanceCounts),
            datasets: [{
                label: 'Number of Trips',
                data: Object.values(ambulanceCounts),
                backgroundColor: '#4BC0C0'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Trips'
                    }
                }
            }
        }
    });
}

function generatePatientStatusChart() {
    const ctx = document.getElementById('patientStatusChart').getContext('2d');
    const statusCounts = trips.reduce((counts, trip) => {
        counts[trip.patientStatus] = (counts[trip.patientStatus] || 0) + 1;
        return counts;
    }, {});

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        }
    });
}

function generatePaymentTypeChart() {
    const ctx = document.getElementById('paymentTypeChart').getContext('2d');
    const paymentCounts = trips.reduce((counts, trip) => {
        counts[trip.paymentType] = (counts[trip.paymentType] || 0) + 1;
        return counts;
    }, {});

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(paymentCounts),
            datasets: [{
                data: Object.values(paymentCounts),
                backgroundColor: ['#FF6384', '#36A2EB']
            }]
        }
    });
}

// Reports Functions
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const timeFrame = document.getElementById('reportTimeFrame').value;
    let startDate, endDate;
    
    if (timeFrame === 'custom') {
        startDate = new Date(document.getElementById('reportStartDate').value);
        endDate = new Date(document.getElementById('reportEndDate').value);
    } else {
        [startDate, endDate] = getDateRange(timeFrame);
    }
    
    const filteredTrips = filterTripsByDateRange(trips, startDate, endDate);
    
    let reportContent = '';
    switch(reportType) {
        case 'financial':
            reportContent = generateFinancialReport(filteredTrips);
            break;
        case 'operational':
            reportContent = generateOperationalReport(filteredTrips);
            break;
        case 'performance':
            reportContent = generatePerformanceReport(filteredTrips);
            break;
    }
    
    document.getElementById('reportContent').innerHTML = reportContent;
}

function generateFinancialReport(trips) {
    const totalRevenue = trips.reduce((sum, trip) => sum + trip.totalCharge, 0);
    const totalExpenses = trips.reduce((sum, trip) => sum + trip.totalExpenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    return `
        <h3>Financial Report</h3>
        <p><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
        <p><strong>Total Expenses:</strong> ₹${totalExpenses.toFixed(2)}</p>
        <p><strong>Net Profit:</strong> ₹${netProfit.toFixed(2)}</p>
        <p><strong>Profit Margin:</strong> ${((netProfit / totalRevenue) * 100).toFixed(2)}%</p>
    `;
}

function generateOperationalReport(trips) {
    const totalTrips = trips.length;
    const averageDistance = trips.reduce((sum, trip) => sum + trip.distance, 0) / totalTrips;
    const ambulanceUtilization = trips.reduce((counts, trip) => {
        counts[trip.ambulance] = (counts[trip.ambulance] || 0) + 1;
        return counts;
    }, {});
    
    return `
        <h3>Operational Report</h3>
        <p><strong>Total Trips:</strong> ${totalTrips}</p>
        <p><strong>Average Distance per Trip:</strong> ${averageDistance.toFixed(2)} km</p>
        <h4>Ambulance Utilization:</h4>
        <ul>
            ${Object.entries(ambulanceUtilization).map(([ambulance, count]) => 
                `<li>Ambulance ${ambulance}: ${count} trips</li>`
            ).join('')}
        </ul>
    `;
}

function generatePerformanceReport(trips) {
    const totalTrips = trips.length;
    const averageRevenue = trips.reduce((sum, trip) => sum + trip.totalCharge, 0) / totalTrips;
    const averageExpenses = trips.reduce((sum, trip) => sum + trip.totalExpenses, 0) / totalTrips;
    const profitableTrips = trips.filter(trip => trip.totalCharge > trip.totalExpenses).length;
    
    return `
        <h3>Performance Report</h3>
        <p><strong>Total Trips:</strong> ${totalTrips}</p>
        <p><strong>Average Revenue per Trip:</strong> ₹${averageRevenue.toFixed(2)}</p>
        <p><strong>Average Expenses per Trip:</strong> ₹${averageExpenses.toFixed(2)}</p>
        <p><strong>Profitable Trips:</strong> ${profitableTrips} (${((profitableTrips / totalTrips) * 100).toFixed(2)}%)</p>
    `;
}

function downloadAllData(format) {
    let data;
    let fileName;
    let mimeType;

    switch(format) {
        case 'csv':
            data = convertToCSV(trips);
            fileName = 'ambulance_trips.csv';
            mimeType = 'text/csv;charset=utf-8;';
            break;
        case 'json':
            data = JSON.stringify(trips, null, 2);
            fileName = 'ambulance_trips.json';
            mimeType = 'application/json;charset=utf-8;';
            break;
        case 'excel':
            data = convertToExcel(trips);
            fileName = 'ambulance_trips.xlsx';
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            break;
    }

    const blob = new Blob([data], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

function convertToCSV(trips) {
    const headers = Object.keys(trips[0]).filter(key => key !== 'expenses');
    const expenseHeaders = Object.keys(trips[0].expenses);
    const allHeaders = [...headers, ...expenseHeaders.map(eh => `expense_${eh}`)];
    
    let csv = allHeaders.join(',') + '\n';
    
    for (const trip of trips) {
        const row = headers.map(header => {
            if (header === 'date') {
                return new Date(trip[header]).toLocaleDateString();
            }
            return trip[header];
        });
        expenseHeaders.forEach(eh => row.push(trip.expenses[eh]));
        csv += row.join(',') + '\n';
    }
    
    return csv;
}

function convertToExcel(trips) {
    const worksheet = XLSX.utils.json_to_sheet(trips.map(trip => ({
        ...trip,
        date: new Date(trip.date).toLocaleDateString(),
        ...Object.entries(trip.expenses).reduce((acc, [key, value]) => {
            acc[`expense_${key}`] = value;
            return acc;
        }, {})
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trips");
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

// Initialize the application
window.addEventListener('load', () => {
    loadTrips();
    updateDashboard();
    updateTripHistory();
    generatePatientDemographicsChart();
    generateTripFrequencyChart();
    
    flatpickr("#startDate", {});
    flatpickr("#endDate", {});
    flatpickr("#reportStartDate", {});
    flatpickr("#reportEndDate", {});
    
    document.getElementById('analysisTimeFrame').addEventListener('change', function() {
        const customDateRange = document.getElementById('customDateRange');
        customDateRange.style.display = this.value === 'custom' ? 'block' : 'none';
    });
    
    document.getElementById('reportTimeFrame').addEventListener('change', function() {
        const reportCustomDateRange = document.getElementById('reportCustomDateRange');
        reportCustomDateRange.style.display = this.value === 'custom' ? 'block' : 'none';
    });
});
