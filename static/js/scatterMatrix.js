const matrix_svg = d3.select("#scatter-matrix-plot"),
    matrix_margin = { top: 30, right: 20, bottom: 100, left: 70 },
    matrix_width = +matrix_svg.attr("width") - matrix_margin.left - matrix_margin.right,
    matrix_height = +matrix_svg.attr("height") - matrix_margin.top - matrix_margin.bottom;

const matrix_chart = matrix_svg.append("g")
    .attr("transform", `translate(${matrix_margin.left},${matrix_margin.top})`);

// Load your JSON data
d3.json("/static/data/default_rich_list.json").then(data => {

    // Sort by BTC descending, slice top 300
    let top100 = data.sort((a, b) => b.BTC - a.BTC).slice(0, 300);

    // Find the top 10 highest unique "Ins" values
    const topIns = [...new Set(top100.map(d => d.Ins))] // Get unique "Ins" values
        .sort((a, b) => b - a) // Sort in descending order
        .slice(0, 10); // Take the top 10

    // Find the top 10 highest unique "Outs" values
    const topOuts = [...new Set(top100.map(d => d.Outs))] // Get unique "Outs" values
        .sort((a, b) => b - a) // Sort in descending order
        .slice(0, 10); // Take the top 10

    // Filter out the observations with the top 10 highest "Ins" and "Outs" values
    top100 = top100.filter(d => !topIns.includes(d.Ins) && !topOuts.includes(d.Outs));
    // Scatterplot matrix variables
    const variables = ["Ins", "HODL_Days", "Outs"];
    const padding = 28;
    const size = (width - (variables.length + 1) * padding) / variables.length + padding;

    // Define scales
    const x = variables.map(v => d3.scaleLinear()
        .domain(d3.extent(top100, d => d[v]))
        .rangeRound([padding / 2, size - padding / 2]));

    const y = x.map(x => x.copy().range([size - padding / 2, padding / 2]));

    // Color scale for Address Type
    const color = d3.scaleOrdinal()
        .domain([...new Set(top100.map(d => d["Address Type"]))])
        .range(d3.schemeCategory10);

    // Axes definitions
    const axisx = d3.axisBottom().ticks(6).tickSize(size * variables.length);
    const axisy = d3.axisLeft().ticks(6).tickSize(-size * variables.length);

    const xAxis = g => g.selectAll("g")
        .data(x)
        .join("g")
        .attr("transform", (d, i) => `translate(${i * size},0)`)
        .each(function(d) { return d3.select(this).call(axisx.scale(d)); })
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));

    const yAxis = g => g.selectAll("g")
        .data(y)
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * size})`)
        .each(function(d) { return d3.select(this).call(axisy.scale(d)); })
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));

    // Append axes to the chart group
    matrix_chart.append("g").call(xAxis);
    matrix_chart.append("g").call(yAxis);

    // Scatterplot cells
    const cell = matrix_chart.append("g")
        .selectAll("g")
        .data(d3.cross(d3.range(variables.length), d3.range(variables.length)))
        .join("g")
        .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`);

    cell.append("rect")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("x", padding / 2 + 0.5)
        .attr("y", padding / 2 + 0.5)
        .attr("width", size - padding)
        .attr("height", size - padding);

    // Scatterplot points
    cell.each(function([i, j]) {
        d3.select(this).selectAll("circle")
            .data(top100.filter(d => !isNaN(d[variables[i]]) && !isNaN(d[variables[j]])))
            .join("circle")
            .attr("cx", d => x[i](d[variables[i]]))
            .attr("cy", d => y[j](d[variables[j]]))
            .attr("r", 3.5)
            .attr("fill-opacity", 0.7)
            .attr("fill", d => color(d["Address Type"]));
    }); // <-- Correctly closing the `.each()` block here.

    // Labels (moved outside of `.each()` to prevent duplication)
    matrix_chart.append("g")
        .style("font", "bold 10px sans-serif")
        .style("pointer-events", "none")
        .selectAll("text")
        .data(variables)
        .join("text")
        .attr("transform", (d, i) => `translate(${i * size},${i * size})`)
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(d => d);


    // Append legend ABOVE the scatterplot
    const legend = matrix_svg.append("g")
        .attr("transform", `translate(${matrix_margin.left}, ${matrix_margin.top - 10})`) // Move above the plot
        .attr("font-size", 12)
        .attr("text-anchor", "start");

    // Add legend items (Side-by-side layout)
    const legendItems = legend.selectAll("g")
        .data(color.domain()) // Get unique Address Types
        .join("g")
        .attr("transform", (d, i) => `translate(${i * 75}, 0)`); // Spread horizontally

    // Add color circles
    legendItems.append("circle")
        .attr("r", 6)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("fill", d => color(d))
        .attr("fill-opacity", 0.7)

    // Add text labels
    legendItems.append("text")
        .attr("x", 12) // Offset for text
        .attr("y", 4)
        .text(d => d);

});


