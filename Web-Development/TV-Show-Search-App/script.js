
const form = document.querySelector("form");
const input = document.querySelector("#input-show");
const showContainer = document.querySelector(".show-container");

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const search = input.value;

    fetch(`https://api.tvmaze.com/search/shows?q=${search}`)
        .then(response => response.json())
        .then(data => {
            showContainer.innerHTML = "";

            data.forEach(result => {
                const show = result.show;

                const showData = document.createElement("div");
                showData.classList.add("show-data");

                const image = document.createElement("img");
                image.src = show.image.medium;

                const showInfo = document.createElement("div");
                showInfo.classList.add("show-info");

                const title = document.createElement("h1");
                title.textContent = show.name;

                const summary = document.createElement("p");
                summary.innerHTML = show.summary;

                showInfo.appendChild(title);
                showInfo.appendChild(summary);

                showData.appendChild(image);
                showData.appendChild(showInfo);

                showContainer.appendChild(showData);
            });
        });
});