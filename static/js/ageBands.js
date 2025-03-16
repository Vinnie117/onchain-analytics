const ageBands_svg = d3.select("#age-bands-plot"),
marginAgeBands = { top: 30, right: 20, bottom: 100, left: 70 },
widthAgeBands = +ageBands_svg.attr("width") - marginAgeBands.left - marginAgeBands.right,
heightAgeBands = +ageBands_svg.attr("height") - marginAgeBands.top - marginAgeBands.bottom;

// Append Y-axis label
ageBands_svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", marginAgeBands.left / 3 + 20) // Adjusted for visibility
    .attr("x", -(heightAgeBands / 2 +20))
    .attr("dy", "-1em")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Number of Addresses");

// Append X-axis label
ageBands_svg.append("text")
    .attr("x", widthAgeBands / 2 + marginAgeBands.left)
    .attr("y", heightAgeBands + marginAgeBands.bottom + 20) // Adjusted
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Age Bands");

// Annotation
ageBands_svg.append("text")
    .attr("x", widthAgeBands + marginAgeBands.right + marginAgeBands.left) // Adjusted
    .attr("y", heightAgeBands + marginAgeBands.top + 100) // Adjusted
    .attr("text-anchor", "end")
    .style("font-size", "12px")
    .style("font-family", "Arial, sans-serif")
    .text("Data Source: bitinfocharts.com");


const ageBands_chart = ageBands_svg.append("g")
.attr("transform", `translate(${marginAgeBands.left},${marginAgeBands.top})`);


// Create a tooltip div and set initial styles
const ageBands_tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load your JSON data
function updateAgeBandsPlot(dataFile = 'default_rich_list.json', topX) {

    d3.json(`/static/data/${dataFile}`).then(data => {
        // Clear existing elements
        ageBands_chart.selectAll("*").remove();

        // Age bands labels (explicit definition for consistent ordering)
        const labels = [
            '24hr', '1 day - 1 week', '1 week - 1 month', '1 month - 3 months', '3 months - 6 months',
            '6 months - 12 months', '1 year - 2 years', '2 years - 3 years',
            '3 years - 5 years', '5 years - 7 years', '7 years - 10 years', '+10 years'
        ];

        // Sort data by BTC value (descending) and slice to topX entries
        const topData = data.sort((a, b) => b.BTC - a.BTC).slice(0, topX);
        console.log("Number of data points for age band bar plot:", topData.length);

        // Count occurrences of each Age Band within the top X entries
        const ageBandCounts = labels.reduce((acc, label) => {
            acc[label] = 0;
            return acc;
        }, {});

        topData.forEach(entry => {
            const band = entry["Age Band"];
            if (labels.includes(band)) {
                ageBandCounts[band] += 1;
            }
        });

        const countData = labels.map(band => ({band,count: ageBandCounts[band]}));

        // X-axis (Age Bands)
        const x = d3.scaleBand()
            .domain(countData.map(d => d.band))
            .range([0, widthAgeBands])
            .padding(0.2);

        ageBands_chart.append("g")
            .attr("transform", `translate(0, ${heightAgeBands})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-25)")
            .style("text-anchor", "end")
            .style("font-size", "12px");

        // Y-axis (Count of Addresses)
        const y = d3.scaleLinear()
            .domain([0, d3.max(countData, d => d.count)])
            .range([heightAgeBands, 0]);

        ageBands_chart.append("g")
            .call(d3.axisLeft(y))
            .style("font-size", "12px");

        // Bars (Age Bands counts)
        ageBands_chart.selectAll(".bar")
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
                ageBands_tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                ageBands_tooltip.html(`Count: ${d.count}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                ageBands_tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        //ageBands_svg.selectAll(".data-label").remove();

        // Y-axis label

})};


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


document.getElementById('age-bands-button').addEventListener('click', () => {
    const userInput = parseInt(document.getElementById('age-bands-input').value, 10) || 300;

    const messageContainer = document.getElementById('age-bands-container');
    messageContainer.textContent = `Starting data fetch for the top ${userInput} richest addresses...`;
    messageContainer.style.color = '#333';

    const messageHistory = [];

    if (window.abortController) {
        window.abortController.abort();
    }
    window.abortController = new AbortController();

    fetch('/playwright-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_input: userInput }),
        signal: window.abortController.signal,
    }).then(async (response) => {
        if (!response.ok) {
            messageContainer.textContent = `Error: ${response.statusText}`;
            messageContainer.style.color = 'red';
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const message = line.substring(6).trim();
                    console.log('Server message:', message);

                    messageHistory.push(message);
                    if (messageHistory.length > 5) {
                        messageHistory.shift();
                    }

                    messageContainer.innerHTML = messageHistory
                        .map(msg => `<div>${msg}</div>`)
                        .join('');

                    if (message.includes('completed')) {
                        messageContainer.style.color = 'green';
                        
                        // Trigger the old functionality when completed
                        updateAgeBandsPlot('rich_list.json', userInput); // Update scatter plot
                        const h2AgeBands = document.getElementById('age-bands-heading');
                        h2AgeBands.textContent = `Age Bands by Richest Addresses (Top ${userInput})`;
                    } else if (message.includes('Error')) {
                        messageContainer.style.color = 'red';
                    } else {
                        messageContainer.style.color = '#333';
                    }

                    messageContainer.scrollTop = messageContainer.scrollHeight;
                }
            }
        }
    }).catch((error) => {
        if (error.name !== 'AbortError') {
            messageContainer.textContent = 'An error occurred while streaming data.';
            messageContainer.style.color = 'red';
        }
    });
});

