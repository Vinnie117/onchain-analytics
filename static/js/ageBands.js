const ageBands_svg = d3.select("#age-bands-plot"),
marginAgeBands = { top: 30, right: 20, bottom: 100, left: 70 },
widthAgeBands = +ageBands_svg.attr("width") - marginAgeBands.left - marginAgeBands.right,
heightAgeBands = +ageBands_svg.attr("height") - marginAgeBands.top - marginAgeBands.bottom;

const ageBands_chart = ageBands_svg.append("g")
.attr("transform", `translate(${marginAgeBands.left},${marginAgeBands.top})`);


// Create a tooltip div and set initial styles
const ageBands_tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load your JSON data
d3.json("/static/data/default_rich_list.json").then(data => {
    
    // Age bands labels (explicit definition for consistent ordering)
    const labels = [
        '24hr', '1 day - 1 week', '1 month - 3 months', '3 months - 6 months',
        '6 months - 12 months', '1 year - 2 years', '2 years - 3 years',
        '3 years - 5 years', '5 years - 7 years', '7 years - 10 years', '+10 years'
    ];

    // Compute counts per Age Band
    const ageBandCounts = labels.reduce((acc, label) => {
        acc[label] = 0;
        return acc;
    }, {});

    data.forEach(entry => {
        const band = entry["Age Band"];
        if (labels.includes(band)) {
            ageBandCounts[band] = (ageBandCounts[band] || 0) + 1;
        }
    });

    const countData = labels.map(band => ({ band, count: ageBandCounts[band] || 0 }));

    // Set plot dimensions
    const margin = { top: 30, right: 20, bottom: 150, left: 50 },
          width = 800 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    // Append SVG container
    const svg = d3.select("#age-bands-plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X-axis (Age Bands)
    const x = d3.scaleBand()
        .domain(countData.map(d => d.band))
        .range([0, width])
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .style("text-anchor", "end")
        .style("font-size", "12px");

    // Y-axis (Count of Addresses)
    const y = d3.scaleLinear()
        .domain([0, d3.max(countData, d => d.count)])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    // Bars (Age Bands counts)
    svg.selectAll(".bar")
        .data(countData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.band))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`Count: ${d.count}`)
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
        .attr("y", -margin.left)
        .attr("x", -(height / 2))
        .attr("dy", "-1em")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Number of Addresses");

    // X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 50)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Age Bands");
});


document.getElementById('age-bands-download').addEventListener('click', () => {
    const svg = document.querySelector('#age-bands-plot');
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
        a.download = 'age_bands.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }).catch(error => console.error('Error loading CSS:', error));
});