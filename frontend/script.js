const svg = d3.select("svg"),
    margin = { top: 30, right: 20, bottom: 100, left: 70 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create a tooltip div and set initial styles
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load your JSON data
d3.json("data/rich_list.json").then(data => {
    // Sort by BTC descending, slice top 10
    const top10 = data.sort((a, b) => b.BTC - a.BTC).slice(0, 20);

    // X scale
    const x = d3.scaleBand()
        .domain(top10.map(d => d["Short Address"]))
        .range([0, width])
        .padding(0.2);

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .style("text-anchor", "end");

    // Y scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(top10, d => d.BTC)]).nice()
        .range([height, 0]);

    chart.append("g")
        .call(d3.axisLeft(y).tickFormat(d => `${d / 1000}k`));
    
    // Bars with tooltips
    chart.selectAll(".bar")
        .data(top10)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d["Short Address"]))
        .attr("y", d => y(d.BTC))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.BTC))
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`BTC: ${d.BTC}<br/>% of Coins: ${d["% of coins"].toFixed(2)}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });



    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left / 5)
        .attr("x", -(height / 2) - margin.top)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("BTC Held");

    // X-axis label
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top + 80)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Short Address");

    // Annotation
    svg.append("text")
        .attr("x", width + margin.right + margin.left)
        .attr("y", height + margin.top + 100)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .style("font-family", "Arial, sans-serif")
        .text("Data Source: bitinfocharts.com");
});

// SVG download code remains the same
document.getElementById('download').addEventListener('click', () => {
    const svg = document.querySelector('svg');
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    if (!source.includes('xmlns="http://www.w3.org/2000/svg"')) {
        source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    fetch('frontend/style.css').then(response => response.text()).then(css => {
        const style = `<style>${css}</style>`;
        source = source.replace('</svg>', `${style}</svg>`);

        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'styled_chart.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }).catch(error => console.error('Error loading CSS:', error));
});
