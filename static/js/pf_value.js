// Select the target SVG and define dimensions/margins
const area_svg = d3.select("#pfvalue-plot"),
    marginArea = { top: 10, right: 10, bottom: 20, left: 40 },
    widthArea = +area_svg.attr("width") - marginArea.left - marginArea.right,
    heightArea = +area_svg.attr("height") - marginArea.top - marginArea.bottom;



// Create group inside SVG
const area_chart = area_svg.append("g")
    .attr("transform", `translate(${marginArea.left},${marginArea.top})`);

function updateStackedAreaChart(dataFile = '/static/data/pf_data.json') {
    d3.json(dataFile).then(rawData => {
        // Prepare data
        const data = rawData.map(d => ({
            date: new Date(d.Date),
            BTC: d.BTC_pf,
            SPY: d.SPY_pf
        }));

        // Stack the data
        const series = d3.stack()
            .keys(["BTC", "SPY"])(data);

        // Scales
        const x = d3.scaleUtc()
            .domain(d3.extent(data, d => d.date))
            .range([0, widthArea]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
            .nice()
            .range([heightArea, 0]);

        const color = d3.scaleOrdinal()
            .domain(["BTC", "SPY"])
            .range(["#f7931a", "#2ca02c"]);

        // Area generator
        const area = d3.area()
            .x(d => x(d.data.date))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));

        // Clear previous content
        area_chart.selectAll("*").remove();

        // Draw areas
        area_chart.selectAll("path")
            .data(series)
            .join("path")
            .attr("fill", d => color(d.key))
            .attr("d", area)
            .append("title")
            .text(d => d.key);

        // Add Y axis
        area_chart.append("g")
            .call(d3.axisLeft(y).ticks(heightArea / 80))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").clone()
                .attr("x2", widthArea)
                .attr("stroke-opacity", 0.1))
            .call(g => g.append("text")
                .attr("x", -marginArea.left)
                .attr("y", 10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .text("↑ Portfolio Value"));

        // Add X axis
        area_chart.append("g")
            .attr("transform", `translate(0,${heightArea})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));

// Tooltip elements
const tooltipLine = area_chart.append("line")
    .style("display", "none")
    .attr("stroke", "#000")
    .attr("y1", 0)
    .attr("y2", heightArea)
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3");

// Select or create HTML tooltip
let htmlTooltip = d3.select("#pfvalue-tooltip");
if (htmlTooltip.empty()) {
    htmlTooltip = d3.select("body").append("div")
        .attr("id", "pfvalue-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "#fff")
        .style("border", "1px solid #333")
        .style("border-radius", "4px")
        .style("padding", "8px 12px")
        .style("font-size", "13px")
        .style("font-family", "sans-serif")
        .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
        .style("display", "none");
}
area_chart.append("rect")
    .attr("width", widthArea)
    .attr("height", heightArea)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseover", () => {
        tooltipLine.style("display", null);
        htmlTooltip.style("display", "block");
    })
    .on("mouseout", () => {
        tooltipLine.style("display", "none");
        htmlTooltip.style("display", "none");
    })
    .on("mousemove", function(event) {
        const [mouseX, mouseY] = d3.pointer(event, this);
        const x0 = x.invert(mouseX);
        const i = d3.bisector(d => d.date).center(data, x0);
        const d = data[i];

        tooltipLine.attr("x1", x(d.date)).attr("x2", x(d.date));

        // Position HTML tooltip near cursor
        const pageX = event.pageX;
        const pageY = event.pageY;

        htmlTooltip
            .style("left", `${pageX + 15}px`)
            .style("top", `${pageY + 15}px`)
            .html(`
                <strong>${d.date.toLocaleDateString()}</strong><br>
                BTC: ${d.BTC.toFixed(2)}<br>
                SPY: ${d.SPY.toFixed(2)}
            `);
    });

    });
}

// Initial call (adjust file path if needed)
updateStackedAreaChart('/static/data/pf_data.json');