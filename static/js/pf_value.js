// Select SVG and define margins/dimensions
const area_svg = d3.select("#pfvalue-plot"),
    marginArea = { top: 60, right: 10, bottom: 20, left: 75 },
    widthArea = +area_svg.attr("width") - marginArea.left - marginArea.right,
    heightArea = +area_svg.attr("height") - marginArea.top - marginArea.bottom;

// SVG group container
const area_chart = area_svg.append("g")
    .attr("transform", `translate(${marginArea.left},${marginArea.top})`);

function updateLineChart(data) {
    // Format and clean data
    const parsedData = data.map(d => ({
        date: new Date(d.Date),
        BTC: d.BTC_pf || 0,
        SPY: d.SPY_pf || 0,
        Combined: d.combined_pf || 0
    }));

    // Clear previous chart
    area_chart.selectAll("*").remove();

    // Stack generator
    const stack = d3.stack()
        .keys(["BTC", "SPY"]);

    const stackedData = stack(parsedData);

    // Scales
    const x = d3.scaleUtc()
        .domain(d3.extent(parsedData, d => d.date))
        .range([0, widthArea]);

    const y = d3.scaleLinear()
        .domain([
            0,
            d3.max(parsedData, d => d.BTC + d.SPY)
        ]).nice()
        .range([heightArea, 0]);

    // Add transparent colors
    const color = d3.scaleOrdinal()
        .domain(["BTC", "SPY", "Combined"])
        .range(["rgba(247, 147, 26, 0.4)", "rgba(44, 160, 44, 0.4)", "#4682b4"]);


    // Axes
    area_chart.append("g")
        .attr("transform", `translate(0,${heightArea})`)
        .call(d3.axisBottom(x));

    area_chart.append("g")
        .call(d3.axisLeft(y));

    // Legend
    const legend = area_chart.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(0, -30)");

    const legendItems = [
    { name: "BTC", color: "rgba(247, 147, 26, 0.6)" },
    { name: "SPY", color: "rgba(44, 160, 44, 0.6)" },
    { name: "Combined", color: "#4682b4", isLine: true }
    ];

    legend.selectAll("g")
    .data(legendItems)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(${i * 100}, 0)`)
    .each(function(d) {
        const g = d3.select(this);
        
        if (d.isLine) {
            g.append("line")
                .attr("x1", 0)
                .attr("y1", 5)
                .attr("x2", 20)
                .attr("y2", 5)
                .attr("stroke", d.color)
                .attr("stroke-width", 2);
        } else {
            g.append("rect")
                .attr("x", 0)
                .attr("y", -5)
                .attr("width", 20)
                .attr("height", 10)
                .attr("fill", d.color);
        }

        g.append("text")
            .attr("x", 25)
            .attr("y", 5)
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .text(d.name);
    });


    // Area generator
    const area = d3.area()
        .x(d => x(d.data.date))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

    // Draw stacked areas
    area_chart.selectAll(".area")
        .data(stackedData)
        .enter()
        .append("path")
        .attr("fill", d => color(d.key))
        .attr("d", area);

    // Draw Combined line
    const combinedLine = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.Combined));

    area_chart.append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "#4682b4")
        .attr("stroke-width", 2)
        .attr("d", combinedLine);

    // Tooltip line
    const tooltipLine = area_chart.append("line")
        .attr("stroke", "#000")
        .attr("y1", 0)
        .attr("y2", heightArea)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .style("display", "none");

    // Tooltip div
    const tooltip = d3.select("#pfvalue-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "#f4f4f4")
        .style("border", "1px solid #333")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "13px")
        .style("display", "none");

    // Interaction
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
        alert('Please enter valid integer allocations.');
        return;
    }

    if (btcAllocation + spyAllocation !== 100) {
        alert('Allocations must sum to exactly 100. Use integers.');
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
    // Update heading with new values
    const heading = document.getElementById('pfvalue-heading');
    heading.innerText = `Portfolio Value for: ${spyAllocation}% SPY and ${btcAllocation}% BTC`;
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


// Enter button
function handleEnterKeyToUpdate(event) {
    if (event.key === 'Enter') {
        document.getElementById("update-portfolio-btn").click();
    }
}    
document.getElementById('allocation-btc').addEventListener('keydown', handleEnterKeyToUpdate);
document.getElementById('allocation-spy').addEventListener('keydown', handleEnterKeyToUpdate);