// Global variables
let countyData = [];
let usaMap = null;
let selectedCounty = null;
let filteredData = [];

// Selected metrics from dropdowns
let socioeconomicMetric = 'median_household_income';
let healthMetric = 'percent_stroke';
let urbanFilter = 'all';

// DOM elements
const socioeconomicSelect = document.getElementById('socioeconomic-select');
const healthSelect = document.getElementById('health-select');
const urbanFilterSelect = document.getElementById('urban-filter');
const resetButton = document.getElementById('reset-button');
const countyDetails = document.getElementById('county-details');
const closeDetailsButton = document.getElementById('close-details');
const mapRadios = document.querySelectorAll('input[name="map-data"]');

// Color scales
const healthColorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([40, 0]);
const incomeColorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 100000]);
const povertyColorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 30]);
const educationColorScale = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, 30]);

// Color scale for urban/rural status
const urbanStatusColors = {
    'Urban': '#1f77b4',
    'Suburban': '#2ca02c',
    'Small City': '#ff7f0e',
    'Rural': '#d62728'
};

// Sample data for testing (use this if CSV loading fails)
const SAMPLE_DATA = [
    {"cnty_fips": 1001, "display_name": "County A", "poverty_perc": 15.1, "median_household_income": 50000, "education_less_than_high_school_percent": 13.4, "percent_inactive": 21.5, "percent_smoking": 18.5, "urban_rural_status": "Rural", "elderly_percentage": 8.8, "number_of_hospitals": 1, "number_of_primary_care_physicians": 2.8, "percent_no_heath_insurance": 12.3, "percent_high_blood_pressure": 34.1, "percent_coronary_heart_disease": 5.9, "percent_stroke": 3.1, "percent_high_cholesterol": 31.2},
    {"cnty_fips": 1002, "display_name": "County B", "poverty_perc": 8.1, "median_household_income": 92000, "education_less_than_high_school_percent": 8.2, "percent_inactive": 20, "percent_smoking": 16.7, "urban_rural_status": "Urban", "elderly_percentage": 5.8, "number_of_hospitals": 5, "number_of_primary_care_physicians": 3.8, "percent_no_heath_insurance": 7.7, "percent_high_blood_pressure": 30.3, "percent_coronary_heart_disease": 4.6, "percent_stroke": 2.3, "percent_high_cholesterol": 30.3},
    {"cnty_fips": 1003, "display_name": "County C", "poverty_perc": 12.3, "median_household_income": 65000, "education_less_than_high_school_percent": 11.0, "percent_inactive": 18.5, "percent_smoking": 17.2, "urban_rural_status": "Suburban", "elderly_percentage": 12.5, "number_of_hospitals": 2, "number_of_primary_care_physicians": 2.1, "percent_no_heath_insurance": 10.5, "percent_high_blood_pressure": 32.7, "percent_coronary_heart_disease": 5.2, "percent_stroke": 2.8, "percent_high_cholesterol": 31.0},
    {"cnty_fips": 1004, "display_name": "County D", "poverty_perc": 18.7, "median_household_income": 42000, "education_less_than_high_school_percent": 15.8, "percent_inactive": 24.2, "percent_smoking": 20.1, "urban_rural_status": "Rural", "elderly_percentage": 18.2, "number_of_hospitals": 0, "number_of_primary_care_physicians": 1.2, "percent_no_heath_insurance": 15.8, "percent_high_blood_pressure": 36.5, "percent_coronary_heart_disease": 6.8, "percent_stroke": 3.7, "percent_high_cholesterol": 32.8},
    {"cnty_fips": 1005, "display_name": "County E", "poverty_perc": 6.2, "median_household_income": 110000, "education_less_than_high_school_percent": 4.5, "percent_inactive": 15.6, "percent_smoking": 12.3, "urban_rural_status": "Suburban", "elderly_percentage": 14.3, "number_of_hospitals": 3, "number_of_primary_care_physicians": 4.5, "percent_no_heath_insurance": 5.2, "percent_high_blood_pressure": 27.9, "percent_coronary_heart_disease": 3.8, "percent_stroke": 1.9, "percent_high_cholesterol": 28.5}
];

// Initialize the dashboard
async function initDashboard() {
    try {
        console.log("Initializing dashboard...");
        
        // Try to load data
        try {
            // Load map topology data
            const [countyCSV, mapJSON] = await Promise.all([
                d3.csv('national_health_data_2024.csv'),
                d3.json('us-counties.json') // Using local file
            ]);

            // Process data
            countyData = processCountyData(countyCSV);
            usaMap = mapJSON;
            console.log("Data loaded successfully:", countyData.length, "counties");
        } catch (error) {
            console.error("Error loading data:", error);
            console.log("Using sample data instead");
            
            // Use sample data as fallback
            countyData = SAMPLE_DATA;
            
            // Try to load just the map data
            try {
                usaMap = await d3.json('us-counties.json');
                console.log("Map data loaded successfully");
            } catch (mapError) {
                console.error("Could not load map data:", mapError);
                // Map visualization will be disabled
            }
        }

        filteredData = [...countyData];

        // Initialize visualizations
        initScatterPlot();
        if (usaMap) {
            initChoroplethMap();
        } else {
            document.getElementById('map-container').innerHTML = 
                '<div class="error-message">Map data could not be loaded</div>';
        }
        initHistogram();
        initUrbanRuralChart();
        updateMetrics();
        
        // Add event listeners
        setupEventListeners();
        
        // Update UI statistics
        updateStatistics();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        alert('Error initializing dashboard. Please check the console for details.');
    }
}

// Process county data
function processCountyData(data) {
    return data.map(d => {
        // Convert string values to numbers
        Object.keys(d).forEach(key => {
            if (key !== 'display_name' && key !== 'urban_rural_status') {
                d[key] = parseFloat(d[key]);
                // Replace negative values with null (missing data)
                if (d[key] < 0) d[key] = null;
            }
        });
        
        // Clean county name
        if (d.display_name) {
            d.display_name = d.display_name.replace(/['"\\]/g, '');
        }
        
        return d;
    });
}

// Set up event listeners
function setupEventListeners() {
    socioeconomicSelect.addEventListener('change', (e) => {
        socioeconomicMetric = e.target.value;
        updateMetrics();
    });
    
    healthSelect.addEventListener('change', (e) => {
        healthMetric = e.target.value;
        updateMetrics();
    });
    
    urbanFilterSelect.addEventListener('change', (e) => {
        urbanFilter = e.target.value;
        filterData();
        updateMetrics();
    });
    
    resetButton.addEventListener('click', () => {
        selectedCounty = null;
        updateMetrics();
    });
    
    closeDetailsButton.addEventListener('click', () => {
        countyDetails.style.display = 'none';
    });
    
    mapRadios.forEach(radio => {
        radio.addEventListener('change', updateChoroplethMap);
    });
}

// Filter data based on user selections
function filterData() {
    filteredData = countyData.filter(d => {
        // Filter by urban/rural status if selected
        if (urbanFilter !== 'all' && d.urban_rural_status !== urbanFilter) {
            return false;
        }
        
        // Filter out records with missing data for selected metrics
        if (d[socioeconomicMetric] === null || d[healthMetric] === null) {
            return false;
        }
        
        return true;
    });
}

// Update all metrics based on user selections
function updateMetrics() {
    filterData();
    updateScatterPlot();
    if (usaMap) {
        updateChoroplethMap();
    }
    updateHistogram();
    updateUrbanRuralChart();
    updateStatistics();
}

// Initialize scatter plot
function initScatterPlot() {
    // Initial setup only - updateScatterPlot will add the actual visualization
    console.log("Initializing scatter plot");
}

// Update the scatter plot
function updateScatterPlot() {
    console.log("Updating scatter plot");
    
    // Clear previous plot
    d3.select('#scatter-plot').html('');
    
    // Set dimensions and margins
    const margin = {top: 20, right: 20, bottom: 60, left: 60};
    const width = document.getElementById('scatter-plot').clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select('#scatter-plot')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    if (filteredData.length === 0) {
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .text('No data available for the selected filters');
        return;
    }
    
    // X scale
    const xScale = d3.scaleLinear()
        .domain(getDataExtent(filteredData, socioeconomicMetric))
        .range([0, width])
        .nice();
    
    // Y scale
    const yScale = d3.scaleLinear()
        .domain(getDataExtent(filteredData, healthMetric))
        .range([height, 0])
        .nice();
    
    // Add X axis
    svg.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', '#666')
        .style('text-anchor', 'middle')
        .text(getMetricLabel(socioeconomicMetric));
    
    // Add Y axis
    svg.append('g')
        .attr('class', 'axis y-axis')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('x', -height / 2)
        .attr('fill', '#666')
        .style('text-anchor', 'middle')
        .text(getMetricLabel(healthMetric));

    // Add scatter dots
    svg.selectAll('.dot')
        .data(filteredData)
        .enter()
        .append('circle')
        .attr('class', d => `dot county-${d.cnty_fips} ${selectedCounty && selectedCounty.cnty_fips === d.cnty_fips ? 'selected' : ''}`)
        .attr('r', 4)
        .attr('cx', d => xScale(d[socioeconomicMetric]))
        .attr('cy', d => yScale(d[healthMetric]))
        .attr('fill', d => urbanStatusColors[d.urban_rural_status] || '#8884d8')
        .on('mouseover', function(event, d) {
            showTooltip(event, d);
        })
        .on('mouseout', hideTooltip)
        .on('click', function(event, d) {
            selectedCounty = d;
            showCountyDetails(d);
            
            // Update selection visualizations
            d3.selectAll('.dot').classed('selected', false);
            d3.select(this).classed('selected', true);
            
            // Update map selection
            d3.selectAll('.county').classed('selected', false);
            d3.select(`.county-${d.cnty_fips}`).classed('selected', true);
            
            updateStatistics();
        });
    
    // Add legend
    const legend = d3.select('#scatter-legend')
        .html('')
        .append('svg')
        .attr('width', 300)
        .attr('height', 50);
    
    const urbanStatuses = Object.keys(urbanStatusColors);
    
    legend.selectAll('legend-item')
        .data(urbanStatuses)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(${i * 75}, 10)`)
        .each(function(d) {
            const g = d3.select(this);
            g.append('circle')
                .attr('cx', 5)
                .attr('cy', 5)
                .attr('r', 5)
                .attr('fill', urbanStatusColors[d]);
            
            g.append('text')
                .attr('x', 15)
                .attr('y', 9)
                .attr('font-size', '10px')
                .text(d);
        });
}

// Initialize the choropleth map
function initChoroplethMap() {
    console.log("Initializing choropleth map");
    
    // Set dimensions and margins
    const margin = {top: 20, right: 20, bottom: 20, left: 20};
    const width = document.getElementById('choropleth-map').clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select('#choropleth-map')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    if (!usaMap) {
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .text('Map data could not be loaded');
        return;
    }
    
    // Prepare map features
    const counties = topojson.feature(usaMap, usaMap.objects.counties).features;
    const states = topojson.feature(usaMap, usaMap.objects.states).features;
    
    // Create a map of FIPS codes to county data
    const countyMap = {};
    countyData.forEach(d => {
        countyMap[d.cnty_fips] = d;
    });
    
    // Create a path generator
    const path = d3.geoPath();
    
    // Draw counties
    svg.selectAll('.county')
        .data(counties)
        .enter()
        .append('path')
        .attr('class', d => `county county-${d.id}`)
        .attr('d', path)
        .attr('fill', d => {
            const county = countyMap[d.id];
            if (!county || county[healthMetric] === null) return '#ccc';
            return healthColorScale(county[healthMetric]);
        })
        .on('mouseover', function(event, d) {
            const county = countyMap[d.id];
            if (county) {
                showTooltip(event, county);
            }
        })
        .on('mouseout', hideTooltip)
        .on('click', function(event, d) {
            const county = countyMap[d.id];
            if (county) {
                selectedCounty = county;
                showCountyDetails(county);
                
                // Update selection visualizations
                d3.selectAll('.county').classed('selected', false);
                d3.select(this).classed('selected', true);
                
                // Update scatter plot selection
                d3.selectAll('.dot').classed('selected', false);
                d3.select(`.dot.county-${county.cnty_fips}`).classed('selected', true);
                
                updateStatistics();
            }
        });
    
    // Draw state boundaries
    svg.append('path')
        .datum(topojson.mesh(usaMap, usaMap.objects.states))
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 0.7)
        .attr('d', path);

    // Create color legend
    createMapLegend();
}

// Update the choropleth map
function updateChoroplethMap() {
    if (!usaMap) return;
    
    console.log("Updating choropleth map");
    
    const mapType = document.querySelector('input[name="map-data"]:checked').value;
    const metric = mapType === 'health' ? healthMetric : socioeconomicMetric;
    
    // Create a map of FIPS codes to county data
    const countyMap = {};
    countyData.forEach(d => {
        countyMap[d.cnty_fips] = d;
    });
    
    // Update county colors
    d3.selectAll('.county')
        .attr('fill', d => {
            const county = countyMap[d.id];
            if (!county || county[metric] === null) return '#ccc';
            
            // Choose color scale based on metric
            if (metric === 'median_household_income') {
                return incomeColorScale(county[metric]);
            } else if (metric === 'poverty_perc') {
                return povertyColorScale(county[metric]);
            } else if (metric === 'education_less_than_high_school_percent') {
                return educationColorScale(county[metric]);
            } else {
                return healthColorScale(county[metric]);
            }
        });
    
    // Update legend
    createMapLegend();
}

// Create map legend
function createMapLegend() {
    // Clear previous legend
    d3.select('#map-legend').html('');
    
    const mapType = document.querySelector('input[name="map-data"]:checked').value;
    const metric = mapType === 'health' ? healthMetric : socioeconomicMetric;
    
    // Set legend dimensions
    const width = 300;
    const height = 50;
    
    // Create SVG for legend
    const svg = d3.select('#map-legend')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Choose appropriate color scale
    let colorScale;
    let legendTitle;
    let format;
    
    if (metric === 'median_household_income') {
        colorScale = incomeColorScale;
        legendTitle = 'Median Household Income';
        format = d => `$${d.toLocaleString()}`;
    } else if (metric === 'poverty_perc') {
        colorScale = povertyColorScale;
        legendTitle = 'Poverty %';
        format = d => `${d}%`;
    } else if (metric === 'education_less_than_high_school_percent') {
        colorScale = educationColorScale;
        legendTitle = 'Less than HS Education %';
        format = d => `${d}%`;
    } else {
        colorScale = healthColorScale;
        legendTitle = getMetricLabel(metric);
        format = d => `${d}%`;
    }
    
    // Create gradient
    const defs = svg.append('defs');
    
    const gradient = defs.append('linearGradient')
        .attr('id', 'color-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
    
    // Sample the color scale to create gradient stops
    const stops = d3.range(0, 1.01, 0.1);
    
    stops.forEach(stop => {
        gradient.append('stop')
            .attr('offset', `${stop * 100}%`)
            .attr('stop-color', colorScale(colorScale.domain()[0] + (colorScale.domain()[1] - colorScale.domain()[0]) * stop));
    });
    
    // Create gradient rectangle
    svg.append('rect')
        .attr('x', 50)
        .attr('y', 15)
        .attr('width', 200)
        .attr('height', 15)
        .style('fill', 'url(#color-gradient)');
    
    // Add legend axis with ticks
    const scale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([50, 250]);
    
    const axis = d3.axisBottom(scale)
        .ticks(5)
        .tickFormat(format);
    
    svg.append('g')
        .attr('transform', 'translate(0, 30)')
        .call(axis)
        .select('.domain')
        .remove();
    
    // Add legend title
    svg.append('text')
        .attr('x', 150)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#666')
        .text(legendTitle);
}

// Initialize histogram
function initHistogram() {
    console.log("Initializing histogram");
    // Initial setup only - updateHistogram will add the actual visualization
    d3.select('#histogram-title').text(getMetricLabel(healthMetric));
}

// Update histogram based on selected health metric
function updateHistogram() {
    console.log("Updating histogram");
    
    // Clear previous plot
    d3.select('#histogram-plot').html('');
    d3.select('#histogram-title').text(getMetricLabel(healthMetric));
    
    // Set dimensions and margins
    const margin = {top: 20, right: 20, bottom: 50, left: 50};
    const width = document.getElementById('histogram-plot').clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select('#histogram-plot')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Filter for valid data points
    const validData = filteredData.filter(d => d[healthMetric] !== null);
    
    if (validData.length === 0) {
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .text('No data available for the selected filters');
        return;
    }
    
    // Compute bins
    const x = d3.scaleLinear()
        .domain(getDataExtent(validData, healthMetric))
        .range([0, width])
        .nice();
    
    const bins = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(10))
        .value(d => d[healthMetric])(validData);
    
    // Y scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height, 0])
        .nice();
    
    // Add X axis
    svg.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', '#666')
        .style('text-anchor', 'middle')
        .text(getMetricLabel(healthMetric));
    
    // Add Y axis
    svg.append('g')
        .attr('class', 'axis y-axis')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('x', -height / 2)
        .attr('fill', '#666')
        .style('text-anchor', 'middle')
        .text('Number of Counties');
    
    // Add bars
    svg.selectAll('.bar')
        .data(bins)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.x0))
        .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr('y', d => y(d.length))
        .attr('height', d => height - y(d.length))
        .attr('fill', '#4682B4')
        .on('mouseover', function(event, d) {
            const tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            
            tooltip.html(`
                <div class="tooltip-title">${getMetricLabel(healthMetric)}: ${d.x0.toFixed(1)} to ${d.x1.toFixed(1)}</div>
                <div>Counties: ${d.length}</div>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.selectAll('.tooltip').remove();
        });
}

// Initialize urban/rural comparison chart
function initUrbanRuralChart() {
    console.log("Initializing urban/rural chart");
    // Initial setup only - updateUrbanRuralChart will add the actual visualization
}

// Update urban/rural comparison chart
function updateUrbanRuralChart() {
    console.log("Updating urban/rural chart");
    
    // Clear previous chart
    d3.select('#urbanrural-chart').html('');
    
    // Set dimensions and margins
    const margin = {top: 20, right: 20, bottom: 50, left: 50};
    const width = document.getElementById('urbanrural-chart').clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select('#urbanrural-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Calculate averages by urban/rural status
    const urbanStatuses = ['Urban', 'Suburban', 'Small City', 'Rural'];
    const averages = [];
    
    urbanStatuses.forEach(status => {
        const countiesInStatus = countyData.filter(c => 
            c.urban_rural_status === status && 
            c[healthMetric] !== null
        );
        
        if (countiesInStatus.length > 0) {
            const sum = countiesInStatus.reduce((acc, c) => acc + c[healthMetric], 0);
            const avg = sum / countiesInStatus.length;
            
            averages.push({
                status,
                average: avg,
                count: countiesInStatus.length
            });
        }
    });
    
    if (averages.length === 0) {
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .text('No data available for urban/rural comparison');
        return;
    }
    
    // X scale
    const x = d3.scaleBand()
        .domain(urbanStatuses)
        .range([0, width])
        .padding(0.2);
    
    // Y scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(averages, d => d.average) * 1.1])
        .range([height, 0])
        .nice();
    
    // Add X axis
    svg.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', '#666')
        .style('text-anchor', 'middle')
        .text('Area Classification');
    
    // Add Y axis
    svg.append('g')
        .attr('class', 'axis y-axis')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('x', -height / 2)
        .attr('fill', '#666')
        .style('text-anchor', 'middle')
        .text(`Average ${getMetricLabel(healthMetric)}`);

        svg.selectAll('.bar-group')
        .data(averages)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.status))
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.average))
        .attr('height', d => height - y(d.average))
        .attr('fill', d => urbanStatusColors[d.status])
        .on('mouseover', function(event, d) {
            const tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            
            tooltip.html(`
                <div class="tooltip-title">${d.status}</div>
                <div>Average ${getMetricLabel(healthMetric)}: <span class="tooltip-value">${d.average.toFixed(1)}</span></div>
                <div>Counties: ${d.count}</div>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.selectAll('.tooltip').remove();
        });
}

// Update statistics based on current filters and selections
function updateStatistics() {
    console.log("Updating statistics");
    
    // Update correlation value
    const correlation = calculateCorrelation(filteredData, socioeconomicMetric, healthMetric);
    document.getElementById('correlation-value').textContent = correlation.toFixed(3);
    document.getElementById('correlation-description').textContent = 
        `Between ${getMetricLabel(socioeconomicMetric)} and ${getMetricLabel(healthMetric)}`;
    
    // Update counties count
    document.getElementById('counties-count').textContent = filteredData.length;
    document.getElementById('counties-description').textContent = 
        urbanFilter === 'all' ? 'Counties with valid data' : `${urbanFilter} counties with valid data`;
    
    // Update selected county
    if (selectedCounty) {
        document.getElementById('selected-county').textContent = selectedCounty.display_name;
        document.getElementById('selected-description').textContent = 
            `${selectedCounty.urban_rural_status} · ${formatValue(selectedCounty[healthMetric], healthMetric)}`;
    } else {
        document.getElementById('selected-county').textContent = 'None';
        document.getElementById('selected-description').textContent = 'Click a point on the scatter plot';
    }
}

// Calculate correlation between two metrics
function calculateCorrelation(data, metric1, metric2) {
    const validData = data.filter(d => d[metric1] !== null && d[metric2] !== null);
    
    if (validData.length < 2) return 0;
    
    const n = validData.length;
    
    // Calculate means
    const mean1 = validData.reduce((sum, d) => sum + d[metric1], 0) / n;
    const mean2 = validData.reduce((sum, d) => sum + d[metric2], 0) / n;
    
    // Calculate covariance and variances
    let covariance = 0;
    let variance1 = 0;
    let variance2 = 0;
    
    validData.forEach(d => {
        const diff1 = d[metric1] - mean1;
        const diff2 = d[metric2] - mean2;
        
        covariance += diff1 * diff2;
        variance1 += diff1 * diff1;
        variance2 += diff2 * diff2;
    });
    
    if (variance1 === 0 || variance2 === 0) return 0;
    
    return covariance / Math.sqrt(variance1 * variance2);
}

// Show tooltip with county information
function showTooltip(event, d) {
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
    
    tooltip.html(`
        <div class="tooltip-title">${d.display_name}</div>
        <div>${getMetricLabel(socioeconomicMetric)}: <span class="tooltip-value">${formatValue(d[socioeconomicMetric], socioeconomicMetric)}</span></div>
        <div>${getMetricLabel(healthMetric)}: <span class="tooltip-value">${formatValue(d[healthMetric], healthMetric)}</span></div>
        <div>Area: ${d.urban_rural_status}</div>
    `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
}

// Hide tooltip
function hideTooltip() {
    d3.selectAll('.tooltip').remove();
}

// Show county details panel
function showCountyDetails(county) {
    console.log("Showing details for county:", county.display_name);
    
    // Populate county details
    document.getElementById('details-county-name').textContent = county.display_name;
    document.getElementById('details-income').textContent = formatValue(county.median_household_income, 'median_household_income');
    document.getElementById('details-poverty').textContent = formatValue(county.poverty_perc, 'poverty_perc');
    document.getElementById('details-education').textContent = formatValue(county.education_less_than_high_school_percent, 'education_less_than_high_school_percent');
    document.getElementById('details-stroke').textContent = formatValue(county.percent_stroke, 'percent_stroke');
    document.getElementById('details-bp').textContent = formatValue(county.percent_high_blood_pressure, 'percent_high_blood_pressure');
    document.getElementById('details-chd').textContent = formatValue(county.percent_coronary_heart_disease, 'percent_coronary_heart_disease');
    document.getElementById('details-cholesterol').textContent = formatValue(county.percent_high_cholesterol, 'percent_high_cholesterol');
    document.getElementById('details-urban').textContent = county.urban_rural_status || 'Unknown';
    document.getElementById('details-elderly').textContent = formatValue(county.elderly_percentage, 'elderly_percentage');
    document.getElementById('details-inactive').textContent = formatValue(county.percent_inactive, 'percent_inactive');
    document.getElementById('details-smoking').textContent = formatValue(county.percent_smoking, 'percent_smoking');
    document.getElementById('details-insurance').textContent = formatValue(county.percent_no_heath_insurance, 'percent_no_heath_insurance');
    
    // Show panel
    countyDetails.style.display = 'block';
}

// Format values based on metric type
function formatValue(value, metric) {
    if (value === null || value === undefined) return 'No data';
    
    if (metric === 'median_household_income') {
        return `$${value.toLocaleString()}`;
    } else if (metric.includes('perc') || metric.includes('percent')) {
        return `${value.toFixed(1)}%`;
    } else {
        return value.toLocaleString();
    }
}

// Get data extent (min/max) for a metric
function getDataExtent(data, metric) {
    const values = data.map(d => d[metric]).filter(v => v !== null);
    if (values.length === 0) return [0, 1]; // Default extent if no data
    return [d3.min(values), d3.max(values)];
}

// Get display label for a metric
function getMetricLabel(metric) {
    const labels = {
        'median_household_income': 'Median Household Income',
        'poverty_perc': 'Poverty Percentage',
        'education_less_than_high_school_percent': 'Less than High School Education %',
        'percent_stroke': 'Stroke %',
        'percent_high_blood_pressure': 'High Blood Pressure %',
        'percent_coronary_heart_disease': 'Coronary Heart Disease %',
        'percent_high_cholesterol': 'High Cholesterol %',
        'percent_inactive': 'Physically Inactive %',
        'percent_smoking': 'Smoking %',
        'percent_no_heath_insurance': 'No Health Insurance %',
        'elderly_percentage': 'Elderly Population %'
    };
    
    return labels[metric] || metric;
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', initDashboard);