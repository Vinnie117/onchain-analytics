const svg = d3.select("svg"),
    margin = { top: 30, right: 20, bottom: 100, left: 70 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load your JSON data
d3.json("data/rich_list.json").then(data => {
    // Sort by BTC descending, slice top 10
    const top10 = data.sort((a, b) => b.BTC - a.BTC).slice(0, 10);

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
        .call(d3.axisLeft(y));

    // Bars
    chart.selectAll(".bar")
        .data(top10)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d["Short Address"]))
        .attr("y", d => y(d.BTC))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.BTC));

    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left / 3)
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
})