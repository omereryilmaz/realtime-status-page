// page is fully loaded
window.addEventListener('load', (event) => {
    setHosts();
});

const createChart = async (pHData) => {
    let time = [];
    let measurementTime = [];
    pHData.forEach(data => {
        time.push(data.time);
        measurementTime.push(data.measurementTime);
    });

    var options = {
        chart: {            
            height: 250,
            type: 'area'
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 1
        },
        markers: {
            size: 3,
        },
        fill: {
          opacity: 0.1
        },
        series: [{
            name: 'Response Time (ms)',
            data: time
        }],
        xaxis: {
            categories: measurementTime
        },
        yaxis: {
            min: 0
        },     
        title: {
          text: time.slice(-1)[0] + ' ms',
          offsetX: 0,
          style: {
            fontSize: '24px',
          }
        },
        subtitle: {
          text: 'Response Time',
          offsetX: 0,
          style: {
            fontSize: '14px',
          }
        }
    }    
    return options;
}

const setHosts = async () => {
    
    const hosts = await getHosts()
                    .then((result) => result);
    if (hosts.length > 0) {
        await fillElements(hosts);
        let pHData = await getPrimaryHostStatus();
        // delete last same data
        pHData.pop();

        let chartOptions = await createChart(pHData);
        let chart = new ApexCharts(document.querySelector("#primary-host-chart"), chartOptions);
        chart.render();

        let primaryHostId = hosts[0]["id"];
        await startSocket(primaryHostId, chart, chartOptions);
    }
    else {
        $('#system-message-div').attr("class", "card mt-3 mb-2 py-2 text-bg-secondary");
        $('#system-message-text').text("There is no data.");
    }
};

const fillElements = async (hosts) => {
    let systemList = document.getElementById("system-list");

    for (let i = 0; i < hosts.length; i++) {
        
        let colDiv = document.createElement("div");
        if (i === 0) {
            colDiv.setAttribute("class", "col-12 mb-3");
        }
        else {
            colDiv.setAttribute("class", "col-md-6 col-xs-12 mb-3");
        }

        let cardDiv = document.createElement("div");
        cardDiv.setAttribute("class", "card primary-host");

        let cardHeaderDiv = document.createElement("div");
        cardHeaderDiv.setAttribute("class", "card-header");

        let cardHeaderIcon = document.createElement("i");
        cardHeaderIcon.setAttribute("class", "fa-solid fa-circle-check fs-4 text-success status-icon");
        cardHeaderIcon.setAttribute("id", `active-${hosts[i]['id']}`);

        let cardHeaderName = document.createElement("h6");
        cardHeaderName.setAttribute("class", "m-0 host-name");
        cardHeaderName.innerHTML = hosts[i]['name'];

        let cardBodyDiv = document.createElement("div");
        cardBodyDiv.setAttribute("class", "card-body text-center");
        
        /* apexcharts div start */
        let apexchartsdiv = document.createElement("div");
        apexchartsdiv.setAttribute("id", "primary-host-chart");
        /* apexcharts div end */

        /* others div start */
        let cardBodyRowDiv = document.createElement("div");
        cardBodyRowDiv.setAttribute("class", "row");

        let cardBodyCol1Div = document.createElement("div");
        cardBodyCol1Div.setAttribute("class", "col-6 h6 text-end");
        cardBodyCol1Div.innerHTML = "Response Time:";

        let cardBodyCol2Div = document.createElement("div");
        cardBodyCol2Div.setAttribute("class", "col-6 h6 text-start");
        cardBodyCol2Div.setAttribute("id", `time-${hosts[i]['id']}`);
        cardBodyCol2Div.innerHTML = "... ms";
        /* others div end */

        let cardFooterDiv = document.createElement("div");
        cardFooterDiv.setAttribute("class", "card-footer text-body-secondary text-end m-0");
        cardFooterDiv.innerHTML = hosts[i]['address'];

        cardBodyRowDiv.appendChild(cardBodyCol1Div);
        cardBodyRowDiv.appendChild(cardBodyCol2Div);

        if (i === 0) {
            // primary system's div
            cardBodyDiv.appendChild(apexchartsdiv);
        }
        else {
            // other system's div
            cardBodyDiv.appendChild(cardBodyRowDiv);
        }
        
        cardHeaderDiv.appendChild(cardHeaderIcon);
        cardHeaderDiv.appendChild(cardHeaderName);

        cardDiv.appendChild(cardHeaderDiv);
        cardDiv.appendChild(cardBodyDiv);
        cardDiv.appendChild(cardFooterDiv);

        colDiv.appendChild(cardDiv);
        //rowDiv.appendChild(colDiv);
    
        systemList.appendChild(colDiv);
    } 
}

const getHosts = async () => {

    // Define the API URL
    const apiUrl = '/api/hosts';

    // Make a GET request
    const data = fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Host API not response.');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error:', error);
        });

        return data;
}

const getPrimaryHostStatus = async () => {

    // Define the API URL
    const apiUrl = '/api/phstatus';

    // Make a GET request
    const data = fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Host API not response.');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error:', error);
        });
        return data;
}


const startSocket = async (primaryHostId, chart, chartOptions) => {
    const socket = io();
    socket.on('hostStatus', (data) => {
        let downCount = 0;        
        data.forEach(item => {
            if (item['isAlive'] === true) {
                $(`#active-${item['id']}`).attr("class", "fa-solid fa-circle-check fs-4 text-success status-icon")
            }
            else{
                $(`#active-${item['id']}`).attr("class", "fa-solid fa-circle-exclamation fs-4 text-danger status-icon")
                downCount++;
            }

            try {
                let htmlValue = $(`#time-${item['id']}`).text();
                if (htmlValue !== `${item['time']} ms` ) {
                    $(`#time-${item['id']}`).hide();
                    $(`#time-${item['id']}`).html(`${item['time']} ms`)
                    $(`#time-${item['id']}`).fadeIn(500);
                }  

                // chart update
                if(item['id'] === primaryHostId){
                    
                    chart.updateOptions({
                        title: {
                            text: `${item['time']} ms`,
                        }
                    });
                    
                    chartOptions.series[0].data.shift();
                    chartOptions.xaxis.categories.shift();
                    chartOptions.xaxis.categories.push(item['measurementTime']);

                    chart.appendData(
                        [
                            {
                                data: [item['time']]
                            }
                        ]
                    );                              
                    
                }

            } catch (error) {
                console.log(error)
            }
        
        });
        
        
        // Status all of systems
        if (downCount > 0) {
            $('#system-message-div').attr("class", "card mt-3 mb-2 py-2 text-bg-danger");
            $('#system-message-text').text(`${downCount} system${downCount>1?'s':''} down!`);
            
        }
        else {
            $('#system-message-div').attr("class", "card mt-3 mb-2 py-2 text-bg-success");
            $('#system-message-text').text("All systems are operational.");
        }
        
    });
}


