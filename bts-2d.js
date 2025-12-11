// Stadium Configuration (same as 3D version)
const STADIUM_CONFIG = {
    totalSeats: 5200,
    sections: 8,
    rowsPerSection: 28,
    seatsPerRow: 28,
    stadiumRadius: 30,
    rowSpacing: 0.6
};

// Generate seat data (same logic as 3D version)
function generateSeatData() {
    const seats = [];
    let seatId = 1;
    
    for (let section = 1; section <= STADIUM_CONFIG.sections; section++) {
        const sectionAngle = (section - 1) * (360 / STADIUM_CONFIG.sections);
        
        for (let row = 1; row <= STADIUM_CONFIG.rowsPerSection; row++) {
            const rowRadius = STADIUM_CONFIG.stadiumRadius + (row - 1) * STADIUM_CONFIG.rowSpacing;
            
            const seatsInRow = Math.floor(STADIUM_CONFIG.seatsPerRow * (0.75 + (row / STADIUM_CONFIG.rowsPerSection) * 0.25));
            const anglePerSeat = (65 / seatsInRow) * (Math.PI / 180);
            
            for (let seatNum = 1; seatNum <= seatsInRow; seatNum++) {
                if (seatNum % 9 === 0) continue; // Skip aisle seats
                
                const seatAngle = sectionAngle * (Math.PI / 180) + (seatNum - seatsInRow / 2) * anglePerSeat;
                const x = Math.cos(seatAngle) * rowRadius;
                const y = Math.sin(seatAngle) * rowRadius;
                
                const isFilled = Math.random() < 0.6;
                
                seats.push({
                    id: seatId++,
                    section: section,
                    row: row,
                    seatNumber: seatNum,
                    x: x,
                    y: y,
                    angle: seatAngle,
                    isFilled: isFilled,
                    status: isFilled ? 'filled' : 'empty'
                });
            }
        }
    }
    
    return seats;
}

// Initialize D3 visualization
let svg, g, width, height, scale;
let seats = [];

function init() {
    const container = d3.select('#svg-container');
    width = window.innerWidth;
    height = window.innerHeight;
    
    // Create SVG
    svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Create main group with transform
    g = svg.append('g');
    
    // Calculate scale to fit stadium
    const maxRadius = STADIUM_CONFIG.stadiumRadius + STADIUM_CONFIG.rowsPerSection * STADIUM_CONFIG.rowSpacing + 5;
    scale = Math.min(width, height) / (maxRadius * 2.2);
    
    // Center the view
    g.attr('transform', `translate(${width / 2}, ${height / 2}) scale(${scale})`);
    
    // Generate seat data
    seats = generateSeatData();
    
    // Draw stadium
    drawStadium();
    drawScreen();
    drawStage();
    drawSeats(seats);
    drawStairs();
    
    // Update statistics
    updateStatistics(seats);
    
    // Handle zoom
    setupZoom();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
}

function drawStadium() {
    // Draw outer wall
    const outerRadius = STADIUM_CONFIG.stadiumRadius + STADIUM_CONFIG.rowsPerSection * STADIUM_CONFIG.rowSpacing + 2;
    
    g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', outerRadius)
        .attr('fill', '#555555')
        .attr('stroke', '#333333')
        .attr('stroke-width', 0.5);
    
    // Draw stadium floor
    const floorRadius = STADIUM_CONFIG.stadiumRadius - 5;
    g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', floorRadius)
        .attr('fill', '#2d5016')
        .attr('stroke', '#1a3d0a')
        .attr('stroke-width', 0.3);
}

function drawScreen() {
    // Draw screen on one side (top of the view)
    const screenWidth = 25;
    const screenHeight = 8;
    const screenY = -(STADIUM_CONFIG.stadiumRadius + STADIUM_CONFIG.rowsPerSection * STADIUM_CONFIG.rowSpacing + 5);
    
    // Screen base
    g.append('rect')
        .attr('x', -screenWidth / 2)
        .attr('y', screenY)
        .attr('width', screenWidth)
        .attr('height', screenHeight)
        .attr('fill', '#2196F3')
        .attr('stroke', '#1976D2')
        .attr('stroke-width', 0.5)
        .attr('rx', 0.5);
    
    // Screen frame
    g.append('rect')
        .attr('x', -screenWidth / 2 + 0.5)
        .attr('y', screenY + 0.5)
        .attr('width', screenWidth - 1)
        .attr('height', screenHeight - 1)
        .attr('fill', '#1565C0')
        .attr('stroke', '#0D47A1')
        .attr('stroke-width', 0.3);
    
    // Screen text/pattern (simulating display)
    for (let i = 0; i < 3; i++) {
        g.append('line')
            .attr('x1', -screenWidth / 2 + 2)
            .attr('y1', screenY + 2 + i * 2)
            .attr('x2', screenWidth / 2 - 2)
            .attr('y2', screenY + 2 + i * 2)
            .attr('stroke', '#64B5F6')
            .attr('stroke-width', 0.2)
            .attr('opacity', 0.6);
    }
    
    // Screen label
    g.append('text')
        .attr('x', 0)
        .attr('y', screenY + screenHeight + 1.5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '2px')
        .attr('font-weight', 'bold')
        .text('MAIN SCREEN');
}

function drawStage() {
    // Draw center stage
    const stageRadius = 8;
    
    g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', stageRadius)
        .attr('fill', '#ff6b6b')
        .attr('stroke', '#d63031')
        .attr('stroke-width', 0.5);
    
    // Stage inner circle
    g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', stageRadius - 0.5)
        .attr('fill', '#ee5a6f')
        .attr('stroke', '#c44569')
        .attr('stroke-width', 0.3);
    
    // Stage label
    g.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '2px')
        .attr('font-weight', 'bold')
        .text('STAGE');
}

function drawSeats(seats) {
    const seatGroup = g.append('g').attr('class', 'seats');
    
    seats.forEach(seat => {
        const color = seat.isFilled ? '#4CAF50' : '#f44336';
        
        seatGroup.append('circle')
            .attr('cx', seat.x)
            .attr('cy', seat.y)
            .attr('r', 0.3)
            .attr('fill', color)
            .attr('stroke', seat.isFilled ? '#2e7d32' : '#c62828')
            .attr('stroke-width', 0.1)
            .attr('opacity', 0.9)
            .attr('data-seat-id', seat.id)
            .on('mouseover', function() {
                d3.select(this).attr('r', 0.5);
            })
            .on('mouseout', function() {
                d3.select(this).attr('r', 0.3);
            });
    });
}

function drawStairs() {
    const stairsGroup = g.append('g').attr('class', 'stairs');
    const stairsMaterial = '#9E9E9E';
    
    // Draw stairs between sections
    for (let section = 0; section < STADIUM_CONFIG.sections; section++) {
        const angle = (section * 360 / STADIUM_CONFIG.sections) * (Math.PI / 180);
        const baseRadius = STADIUM_CONFIG.stadiumRadius + 12;
        
        for (let row = 0; row < STADIUM_CONFIG.rowsPerSection; row++) {
            const stepRadius = baseRadius + row * STADIUM_CONFIG.rowSpacing;
            const x = Math.cos(angle) * stepRadius;
            const y = Math.sin(angle) * stepRadius;
            
            stairsGroup.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 0.4)
                .attr('fill', stairsMaterial)
                .attr('opacity', 0.7);
        }
    }
    
    // Draw horizontal aisles
    for (let row = 0; row < STADIUM_CONFIG.rowsPerSection; row += 5) {
        const aisleRadius = STADIUM_CONFIG.stadiumRadius + row * STADIUM_CONFIG.rowSpacing;
        
        stairsGroup.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', aisleRadius)
            .attr('fill', 'none')
            .attr('stroke', stairsMaterial)
            .attr('stroke-width', 0.3)
            .attr('stroke-dasharray', '1,1')
            .attr('opacity', 0.5);
    }
}

function setupZoom() {
    const zoom = d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // Set initial zoom transform
    svg.call(zoom.transform, d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
    );
}

function handleResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    
    svg.attr('width', width).attr('height', height);
    
    const maxRadius = STADIUM_CONFIG.stadiumRadius + STADIUM_CONFIG.rowsPerSection * STADIUM_CONFIG.rowSpacing + 5;
    scale = Math.min(width, height) / (maxRadius * 2.2);
    
    // Reset zoom transform
    const zoom = d3.zoom();
    svg.call(zoom.transform, d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
    );
}

function updateStatistics(seats) {
    const total = seats.length;
    const filled = seats.filter(s => s.isFilled).length;
    const empty = total - filled;
    const occupancyRate = ((filled / total) * 100).toFixed(1);
    
    document.getElementById('total-seats').textContent = total.toLocaleString();
    document.getElementById('filled-seats').textContent = filled.toLocaleString();
    document.getElementById('empty-seats').textContent = empty.toLocaleString();
    document.getElementById('occupancy-rate').textContent = occupancyRate + '%';
}

// Initialize when page loads
window.addEventListener('load', init);

// Export seat data for external use
function getSeatData() {
    return generateSeatData();
}

