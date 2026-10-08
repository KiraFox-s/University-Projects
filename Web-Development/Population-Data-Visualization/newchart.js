const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/12dy.px";

const areaCode = localStorage.getItem("areaCode");
const municipality = localStorage.getItem("municipality");

const years = [
    "2000", "2001", "2002", "2003", "2004", "2005",
    "2006", "2007", "2008", "2009", "2010", "2011",
    "2012", "2013", "2014", "2015", "2016", "2017",
    "2018", "2019", "2020", "2021"
];

function createRequestBody(contentsCode) {
    return {
        query: [
            {
                code: "timeperiod_y",
                selection: {
                    filter: "item",
                    values: years
                }
            },
            {
                code: "alue_23_20260101",
                selection: {
                    filter: "item",
                    values: [areaCode]
                }
            },
            {
                code: "contentscode",
                selection: {
                    filter: "item",
                    values: [contentsCode]
                }
            }
        ],
        response: {
            format: "json-stat2"
        }
    };
}

const birthRequest = createRequestBody("synt-vm01");
const deathRequest = createRequestBody("synt-vm11");

Promise.all([
    fetch(url, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(birthRequest)
    }).then(response => response.json()),

    fetch(url, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(deathRequest)
    }).then(response => response.json())
])
.then(([birthData, deathData]) => {

    const chart = new frappe.Chart("#chart", {
        title: `Births and deaths in ${municipality}`,
        data: {
            labels: years,
            datasets: [
                {
                    name: "Births",
                    values: birthData.value
                },
                {
                    name: "Deaths",
                    values: deathData.value
                }
            ]
        },
        type: "bar",
        height: 450,
        colors: ["#63d0ff", "#363636"]
    });

});

document.getElementById("navigation").addEventListener("click", function () {
    window.location.href = "index.html";
});