const svgScatter = d3.select("#scatter-plot"),
    marginScatter = { top: 30, right: 20, bottom: 100, left: 70 },
    widthScatter = +svgScatter.attr("width") - marginScatter.left - marginScatter.right,
    heightScatter = +svgScatter.attr("height") - marginScatter.top - marginScatter.bottom;

const chartScatter = svgScatter.append("g")
    .attr("transform", `translate(${marginScatter.left},${marginScatter.top})`);

// Load the JSON data for the scatter plot
d3.json("data/rich_list.json").then(data => {
    // Sort and slice top 20, now using the correct key "HODL_Days"
    const top = data.sort((a, b) => b.BTC - a.BTC).slice(0, 300);

    // Check the HODL_Days values
    console.log("HODL Days values:", top.map(d => d.HODL_Days));

    // X scale for BTC
    const xScatter = d3.scaleLinear()
        .domain([0, d3.max(top, d => d.BTC)]).nice()
        .range([0, widthScatter]);

    chartScatter.append("g")
        .attr("transform", `translate(0,${heightScatter})`)
        .call(d3.axisBottom(xScatter).tickFormat(d3.format(".2s")));

    // Y scale for HODL_Days as an integer scale
    const yMax = d3.max(top, d => d.HODL_Days);
    const yScatter = d3.scaleLinear()
        .domain([0, yMax]).nice()
        .range([heightScatter, 0]);

    chartScatter.append("g")
        .call(d3.axisLeft(yScatter).ticks(10).tickFormat(d3.format(".0f")));

    // Scatter points
    chartScatter.selectAll(".point")
        .data(top)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => xScatter(d.BTC))
        .attr("cy", d => yScatter(d.HODL_Days))
        .attr("r", 5)
        .style("fill", "steelblue");

    // Y-axis label
    svgScatter.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", marginScatter.left / 5)
        .attr("x", -(heightScatter / 2) - marginScatter.top)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("HODL Days");

    // X-axis label
    svgScatter.append("text")
        .attr("x", widthScatter / 2 + marginScatter.left)
        .attr("y", heightScatter + marginScatter.top + 80)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Amount BTC");

    // Annotation
    svgScatter.append("text")
        .attr("x", width + margin.right + margin.left)
        .attr("y", height + margin.top + 100)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .style("font-family", "Arial, sans-serif")
        .text("Data Source: bitinfocharts.com");
});


document.getElementById('download-scatter').addEventListener('click', () => {
    const svg = document.querySelector('#scatter-plot');
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
        a.download = 'scatterplot.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }).catch(error => console.error('Error loading CSS:', error));
});
