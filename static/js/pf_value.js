// Select the target SVG and define dimensions/margins
const area_svg = d3.select("#pfvalue-plot"),
    marginArea = { top: 10, right: 10, bottom: 20, left: 75 },
    widthArea = +area_svg.attr("width") - marginArea.left - marginArea.right,
    heightArea = +area_svg.attr("height") - marginArea.top - marginArea.bottom;



// Create group inside SVG
const area_chart = area_svg.append("g")
    .attr("transform", `translate(${marginArea.left},${marginArea.top})`);

function updateLineChart(dataFile = '/static/data/pf_data.json') {
    d3.json(dataFile).then(rawData => {
        const data = rawData.map(d => ({
            date: new Date(d.Date),
            BTC: d.BTC_pf,
            SPY: d.SPY_pf
        }));

        // Scales
        const x = d3.scaleUtc()
            .domain(d3.extent(data, d => d.date))
            .range([0, widthArea]);

        const y = d3.scaleLinear()
            .domain([
                0,
                d3.max(data, d => Math.max(d.BTC, d.SPY))
            ])
            .nice()
            .range([heightArea, 0]);

        const color = d3.scaleOrdinal()
            .domain(["BTC", "SPY"])
            .range(["#f7931a", "#2ca02c"]);

        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.value));

        // Clear previous content
        area_chart.selectAll("*").remove();

        // Draw BTC and SPY lines
        ["BTC", "SPY"].forEach(key => {
            const lineData = data.map(d => ({ date: d.date, value: d[key] }));

            area_chart.append("path")
                .datum(lineData)
                .attr("fill", "none")
                .attr("stroke", color(key))
                .attr("stroke-width", 2)
                .attr("d", line)
                .append("title")
                .text(key);
        });

        // Add Y axis
        area_chart.append("g")
            .call(d3.axisLeft(y).ticks(heightArea / 80))
            .selectAll("text")
            .style("font-size", "12px");

        // Y-axis label
        area_svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", marginArea.left / 5)
            .attr("x", -(heightArea / 2) - marginArea.top)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .text("Portfolio Value");

        // Add X axis
        area_chart.append("g")
            .attr("transform", `translate(0,${heightArea})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .style("font-size", "12px");

        // Tooltip elements
        const tooltipLine = area_chart.append("line")
            .style("display", "none")
            .attr("stroke", "#000")
            .attr("y1", 0)
            .attr("y2", heightArea)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");

        let htmlTooltip = d3.select("#pfvalue-tooltip");

        htmlTooltip = d3.select("body").append("div")
            .attr("id", "pfvalue-tooltip")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("background", "#bcb6bf")
            .style("border", "1px solid #333")
            .style("border-radius", "4px")
            .style("padding", "8px 12px")
            .style("font-size", "13px")
            .style("font-family", "sans-serif")
            .style("box-shadow", "0 2px 6px rgba(31, 179, 134, 0.15)")
            .style("display", "none");
        

        // Mouse interaction
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
                const [mouseX] = d3.pointer(event, this);
                const x0 = x.invert(mouseX);
                const i = d3.bisector(d => d.date).center(data, x0);
                const d = data[i];

                tooltipLine.attr("x1", x(d.date)).attr("x2", x(d.date));

                htmlTooltip
                    .style("left", `${event.pageX + 15}px`)
                    .style("top", `${event.pageY + 15}px`)
                    .html(`
                        <strong>${d.date.toLocaleDateString()}</strong><br>
                        BTC_pf: ${d.BTC.toFixed(2)}<br>
                        SPY_pf: ${d.SPY.toFixed(2)}
                    `);
            });
    });
}

// Initial call
updateLineChart('/static/data/pf_data.json');


document.getElementById('pfvalue-download').addEventListener('click', () => {
    const svg = document.querySelector('#pfvalue-plot');
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    if (!source.includes('xmlns="http://www.w3.org/2000/svg"')) {
        source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    fetch('/static/css/style.css').then(response => response.text()).then(css => {
        const style = `<style>${css}</style>`;
        source = source.replace('</svg>', `${style}</svg>`);

        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'pf_value.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }).catch(error => console.error('Error loading CSS:', error));
});