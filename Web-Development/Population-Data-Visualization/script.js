const areaUrl = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/12dy.px";

const requestBody = {
    query: [
        {
            code: "timeperiod_y",
            selection: {
                filter: "item",
                values: [
                    "2000", "2001", "2002", "2003", "2004", "2005",
                    "2006", "2007", "2008", "2009", "2010", "2011",
                    "2012", "2013", "2014", "2015", "2016", "2017",
                    "2018", "2019", "2020", "2021"
                ]
            }
        },
        {
            code: "alue_23_20260101",
            selection: {
                filter: "item",
                values: ["SSS"]
            }
        },
        {
            code: "contentscode",
            selection: {
                filter: "item",
                values: ["synt-vaesto"]
            }
        }
    ],
    response: {
        format: "json-stat2"
    }
};

const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/12dy.px";

let chart;
let currentValues = [];

fetch(url, {
    method: "POST",
    headers: {
        "content-type": "application/json"
    },
    body: JSON.stringify(requestBody)
})
.then(response => response.json())
.then(data => {
    chart = new frappe.Chart("#chart", {
        title: "Population in Finland (2000-2021)",
        data: {
            labels: [
                "2000", "2001", "2002", "2003", "2004", "2005",
                "2006", "2007", "2008", "2009", "2010", "2011",
                "2012", "2013", "2014", "2015", "2016", "2017",
                "2018", "2019", "2020", "2021"
            ],
            datasets: [
                {
                    name: "Population",
                    values: data.value
                }
            ]
        },
        type: "line",
        height: 450,
        colors: ["#eb5146"]
    });

    currentValues = data.value;
    
});

document.getElementById("submit-data").addEventListener("click", function () {
    const municipality = document.getElementById("input-area").value;

    fetch(areaUrl)
        .then(response => response.json())
        .then(data => {
            const areaCodes = data.variables[1].values;
            const areaNames = data.variables[1].valueTexts;

            const index = areaNames.findIndex(
                name => name.toLowerCase() === municipality.toLowerCase()
            );

            const areaCode = areaCodes[index];

            console.log(municipality);
            console.log(areaCode);

            localStorage.setItem("areaCode", areaCode);
            localStorage.setItem("municipality", municipality);

            requestBody.query[1].selection.values = [areaCode];

            fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => response.json())
            .then(data => {
                chart.update({
                    labels: [
                        "2000", "2001", "2002", "2003", "2004", "2005",
                        "2006", "2007", "2008", "2009", "2010", "2011",
                        "2012", "2013", "2014", "2015", "2016", "2017",
                        "2018", "2019", "2020", "2021"
                    ],
                    datasets: [
                        {
                            name: "Population",
                            values: data.value
                        }
                    ]
                });
            });
        });
});

document.getElementById("add-data").addEventListener("click", function () {

    const deltas = [];

    for (let i = 1; i < currentValues.length; i++) {
        deltas.push(currentValues[i] - currentValues[i - 1]);
    }

    const sum = deltas.reduce((total, value) => total + value, 0);
    const mean = sum / deltas.length;

    const newValue = currentValues[currentValues.length - 1] + mean;

    currentValues.push(newValue);

    const newYear = 2022 + (currentValues.length - 23);

    chart.update({
        labels: [
            "2000", "2001", "2002", "2003", "2004", "2005",
            "2006", "2007", "2008", "2009", "2010", "2011",
            "2012", "2013", "2014", "2015", "2016", "2017",
            "2018", "2019", "2020", "2021",
            String(newYear)
        ],
        datasets: [
            {
                name: "Population",
                values: currentValues
            }
        ]
    });

    console.log("Predicted value:", newValue);
});

document.getElementById("navigation").addEventListener("click", function () {
    window.location.href = "newchart.html";
});