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
        distance: parseFloat(document.getElementById('distance').value),
        charge: parseFloat(document.getElementById('charge').value),
        totalCharge: parseFloat(document.getElementById('totalCharge').value),
        paymentType: document.getElementById('paymentType').value,
        expenses: {
            driver: parseFloat(document.getElementById('driverExpense').value),
            fuel: parseFloat(document.getElementById('fuelExpense').value),
            maintenance: parseFloat(document.getElementById('maintenanceExpense').value),
            nursingStaff: parseFloat(document.getElementById('nursingStaffExpense').value),
            misc: parseFloat(document.getElementById('miscExpense').value)
        },
        totalExpenses: parseFloat(document.getElementById('totalExpenses').value),
        date: new Date().toISOString()
    };
    trips.push(trip);
    saveTrips();
    this.reset();
    alert('Trip recorded successfully!');
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

function calculateTotalCharge() {
    const distance = parseFloat(document.getElementById('distance').value) || 0;
    const charge = parseFloat(document.getElementById('charge').value) || 0;
    const totalCharge = distance * charge;
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

// Load trips when the page loads
loadTrips();

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

// Initialize the page by showing the Trip Recording section
showSection('tripRecording');
// ... (previous code remains the same) ...

// Financial Analysis Functions
function generateFinancialAnalysis() {
    const timeFrame = document.getElementById('analysisTimeFrame').value;
    const filteredTrips = filterTripsByTimeFrame(trips, timeFrame);
    
    const totalRevenue = filteredTrips.reduce((sum, trip) => sum + trip.totalCharge, 0);
    const totalExpenses = filteredTrips.reduce((sum, trip) => sum + trip.totalExpenses, 0);
    const netProfit = totalRevenue - totalExpenses;

    const summaryHtml = `
        <p><strong>Total Revenue:</strong> $${totalRevenue.toFixed(2)}</p>
        <p><strong>Total Expenses:</strong> $${totalExpenses.toFixed(2)}</p>
        <p><strong>Net Profit:</strong> $${netProfit.toFixed(2)}</p>
    `;
    document.getElementById('financialSummary').innerHTML = summaryHtml;

    generateExpenditureChart(filteredTrips);
    generateCostRevenueChart(filteredTrips);
}

function filterTripsByTimeFrame(trips, timeFrame) {
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

    return trips.filter(trip => new Date(trip.date) >= startDate);
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
                        text: 'Amount ($)'
                    }
                }
            }
        }
    });
}

function calculateRevenueDistribution() {
    const allocationPercentage = parseFloat(document.getElementById('revenueAllocation').value);
    const totalRevenue = trips.reduce((sum, trip) => sum + trip.totalCharge, 0);
    const allocatedAmount = totalRevenue * (allocationPercentage / 100);
    const remainingAmount = totalRevenue - allocatedAmount;

    const resultHtml = `
        <p><strong>Total Revenue:</strong> $${totalRevenue.toFixed(2)}</p>
        <p><strong>Allocated Amount (${allocationPercentage}%):</strong> $${allocatedAmount.toFixed(2)}</p>
        <p><strong>Remaining Amount:</strong> $${remainingAmount.toFixed(2)}</p>
    `;
    document.getElementById('revenueDistributionResult').innerHTML = resultHtml;
}

// Data Analytics Functions
function updateTripHistory() {
    const searchTerm = document.getElementById('tripSearch').value.toLowerCase();
    const filteredTrips = trips.filter(trip => 
        trip.patientName.toLowerCase().includes(searchTerm) ||
        trip.origin.toLowerCase().includes(searchTerm) ||
        trip.destination.toLowerCase().includes(searchTerm)
    );

    const tableHtml = `
        <table class="table">
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
                ${filteredTrips.map(trip => `
                    <tr>
                        <td>${new Date(trip.date).toLocaleDateString()}</td>
                        <td>${trip.patientName}</td>
                        <td>${trip.origin}</td>
                        <td>${trip.destination}</td>
                        <td>$${trip.totalCharge.toFixed(2)}</td>
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
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
            }]
        }
    });
}

function generateTripFrequencyChart() {
    const ctx = document.getElementById('tripFrequencyChart').getContext('2d');
    const tripDates = trips.map(trip => new Date(trip.date).toLocaleDateString());
    const tripCounts = tripDates.reduce((counts, date) => {
        counts[date] = (counts[date] || 0) + 1;
        return counts;
    }, {});

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(tripCounts),
            datasets: [{
                label: 'Number of Trips',
                data: Object.values(tripCounts),
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
    const totalTrips = trips.length;
    const totalRevenue = trips.reduce((sum, trip) => sum + trip.totalCharge, 0);
    const totalExpenses = trips.reduce((sum, trip) => sum + trip.totalExpenses, 0);
    const netProfit = totalRevenue - totalExpenses;

    document.getElementById('totalTripsCount').textContent = totalTrips;
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('netProfit').textContent = `$${netProfit.toFixed(2)}`;

    generateRevenueTrendChart();
    generateAmbulanceUtilizationChart();
}

function generateRevenueTrendChart() {
    const ctx = document.getElementById('revenueTrendChart').getContext('2d');
    const monthlyRevenue = trips.reduce((revenue, trip) => {
        const month = new Date(trip.date).toLocaleString('default', { month: 'short' });
        revenue[month] = (revenue[month] || 0) + trip.totalCharge;
        return revenue;
    }, {});

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(monthlyRevenue),
            datasets: [{
                label: 'Monthly Revenue',
                data: Object.values(monthlyRevenue),
                borderColor: '#36A2EB',
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    }
                }
            }
        }
    });
}

// ... (previous code remains the same) ...

function generateAmbulanceUtilizationChart() {
    const ctx = document.getElementById('ambulanceUtilizationChart').getContext('2d');
    const ambulanceUsage = trips.reduce((usage, trip) => {
        usage[trip.ambulance] = (usage[trip.ambulance] || 0) + 1;
        return usage;
    }, {});

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(ambulanceUsage),
            datasets: [{
                label: 'Number of Trips',
                data: Object.values(ambulanceUsage),
                backgroundColor: '#4BC0C0'
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

// Event listeners for new features
document.getElementById('tripSearch').addEventListener('input', updateTripHistory);
document.getElementById('analysisTimeFrame').addEventListener('change', generateFinancialAnalysis);

// Function to initialize all charts and data
function initializeApp() {
    loadTrips();
    updateTripHistory();
    generateFinancialAnalysis();
    generatePatientDemographicsChart();
    generateTripFrequencyChart();
    updateDashboard();
}

// Call initializeApp when the page loads
window.addEventListener('load', initializeApp);
