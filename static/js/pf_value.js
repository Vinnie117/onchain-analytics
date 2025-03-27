// Select SVG and define margins/dimensions
const area_svg = d3.select("#pfvalue-plot"),
    marginArea = { top: 10, right: 10, bottom: 20, left: 75 },
    widthArea = +area_svg.attr("width") - marginArea.left - marginArea.right,
    heightArea = +area_svg.attr("height") - marginArea.top - marginArea.bottom;

// SVG group container
const area_chart = area_svg.append("g")
    .attr("transform", `translate(${marginArea.left},${marginArea.top})`);

// Function to render line chart
function updateLineChart(data) {
    // Format data
    const parsedData = data.map(d => ({
        date: new Date(d.Date),
        BTC: d.BTC_pf,
        SPY: d.SPY_pf,
        Combined: d.combined_pf
    }));

    // Clear existing content
    area_chart.selectAll("*").remove();

    // Scales
    const x = d3.scaleUtc()
        .domain(d3.extent(parsedData, d => d.date))
        .range([0, widthArea]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(parsedData, d => Math.max(d.BTC, d.SPY, d.Combined))]).nice()
        .range([heightArea, 0]);

    const color = d3.scaleOrdinal()
        .domain(["BTC", "SPY", "Combined"])
        .range(["#f7931a", "#2ca02c", "#4682b4"]);

    // Axes
    area_chart.append("g")
        .attr("transform", `translate(0,${heightArea})`)
        .call(d3.axisBottom(x));

    area_chart.append("g")
        .call(d3.axisLeft(y));

    // Line generator
    const line = key => d3.line()
        .x(d => x(d.date))
        .y(d => y(d[key]));

    // Draw lines for BTC, SPY, and Combined portfolios
    ["BTC", "SPY", "Combined"].forEach(key => {
        area_chart.append("path")
            .datum(parsedData)
            .attr("fill", "none")
            .attr("stroke", color(key))
            .attr("stroke-width", 2)
            .attr("d", line(key));
    });

    // Tooltip interaction elements
    const tooltipLine = area_chart.append("line")
        .attr("stroke", "#000")
        .attr("y1", 0)
        .attr("y2", heightArea)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .style("display", "none");

    const tooltip = d3.select("#pfvalue-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "#f4f4f4")
        .style("border", "1px solid #333")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "13px")
        .style("display", "none");

    // Interaction rectangle
    area_chart.append("rect")
        .attr("width", widthArea)
        .attr("height", heightArea)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mouseover", () => {
            tooltip.style("display", "block");
            tooltipLine.style("display", "block");
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
            tooltipLine.style("display", "none");
        })
        .on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event, this);
            const x0 = x.invert(mouseX);
            const bisect = d3.bisector(d => d.date).center;
            const i = bisect(parsedData, x0);
            const d = parsedData[i];

            tooltipLine.attr("x1", x(d.date)).attr("x2", x(d.date));

            tooltip
                .style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY + 15}px`)
                .html(`
                    <strong>${d.date.toLocaleDateString()}</strong><br>
                    BTC: ${d.BTC.toFixed(2)}<br>
                    SPY: ${d.SPY.toFixed(2)}<br>
                    Combined: ${d.Combined.toFixed(2)}
                `);
        });
}

// Initial load
fetch('/static/data/pf_data.json')
    .then(response => response.json())
    .then(data => updateLineChart(data))
    .catch(console.error);

// Event handler for updating portfolio
document.getElementById("update-portfolio-btn").addEventListener("click", () => {
    const btcInput = document.getElementById('allocation-btc').value.trim();
    const spyInput = document.getElementById('allocation-spy').value.trim();

    const btcAllocation = parseInt(btcInput, 10);
    const spyAllocation = parseInt(spyInput, 10);

    if (
        isNaN(btcAllocation) || isNaN(spyAllocation) ||
        btcInput.includes('.') || spyInput.includes('.')
    ) {
        alert('Please enter valid integer allocations (no decimals).');
        return;
    }

    if (btcAllocation + spyAllocation !== 100) {
        alert('Allocations must sum to exactly 100.');
        return;
    }

    fetch('/api/update-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ btc_start: btcAllocation, spy_start: spyAllocation })
    })
    .then(res => res.json())
    .then(result => {
        if (result.status === "success") {
            updateLineChart(result.data);
        } else {
            alert("Error calculating portfolio. Check server logs.");
        }
    })
    .catch(err => {
        console.error("Fetch error:", err);
        alert("Error updating portfolio data.");
    });
});

// SVG download button
document.getElementById('pfvalue-download').addEventListener('click', () => {
    const svg = document.querySelector('#pfvalue-plot');
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    if (!source.includes('xmlns="http://www.w3.org/2000/svg"')) {
        source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});
