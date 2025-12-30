let theaterData = JSON.parse(localStorage.getItem('theaterData')) || [];
let table;

$(document).ready(function() {
    $(".datepicker").datepicker({
        dateFormat: 'yy-mm-dd',
        maxDate: 0
    });

    table = $('#theaterTable').DataTable({
        data: theaterData,
        columns: [
            { className: 'details-control', orderable: false, data: null, defaultContent: '+' },
            { data: 'name' },
            { data: 'location' },
            { data: 'screens' },
            { 
                data: 'launchDate',
                render: function(data) {
                    const diff = (new Date() - new Date(data)) / (1000 * 60 * 60 * 24);
                    return diff <= 7 ? '<span class="status-badge status-new">New</span>' : '<span class="status-badge status-old">Old</span>';
                }
            },
            { data: 'launchDate' },
            { 
                data: null,
                render: function(data) {
                    return `<button onclick="openMovieForm('${data.id}')">Add Movie</button>
                            <button onclick="editTheater('${data.id}')">Edit</button>
                            <button style="background:red;color:white;" onclick="deleteTheater('${data.id}')">Delete</button>`;
                }
            }
        ]
    });

    $('#theaterTable tbody').on('click', 'td.details-control', function() {
        var tr = $(this).closest('tr');
        var row = table.row(tr);
        if (row.child.isShown()) {
            row.child.hide();
            $(this).text('+');
        } else {
            row.child(formatMovies(row.data())).show();
            $(this).text('-');
        }
    });

    $("#theaterForm").submit(function(e) {
        e.preventDefault();
        if (validateTheater()) {
            const id = $("#theaterId").val() || Date.now().toString();
            const theater = {
                id: id,
                name: $("#theaterName").val(),
                location: $("#location").val(),
                screens: $("#totalScreens").val(),
                active: $("#theaterActive").is(":checked"),
                launchDate: $("#launchDate").val(),
                movies: theaterData.find(t => t.id === id)?.movies || []
            };
            const idx = theaterData.findIndex(t => t.id === id);
            if (idx > -1) theaterData[idx] = theater;
            else theaterData.push(theater);
            saveToLocalStorage();
            refreshTable();
            $("#theaterModal").dialog("close");
        }
    });

    $("#movieForm").submit(function(e) {
        e.preventDefault();
        if (validateMovie()) {
            const tId = $("#targetTheaterId").val();
            const mId = $("#movieId").val() || Date.now().toString();
            const theater = theaterData.find(t => t.id === tId);
            const movie = {
                id: mId,
                title: $("#movieTitle").val(),
                desc: $("#movieDesc").val(),
                genre: $("#genre").val(),
                releaseDate: $("#releaseDate").val(),
                duration: $("#duration").val(),
                price: parseFloat($("#ticketPrice").val()),
                discount: parseFloat($("#discount").val()) || 0,
                active: $("#movieActive").is(":checked")
            };
            const mIdx = theater.movies.findIndex(m => m.id === mId);
            if (mIdx > -1) theater.movies[mIdx] = movie;
            else {
                if(theater.movies.length >= 15) { alert("Max 15 movies allowed"); return; }
                theater.movies.push(movie);
            }
            saveToLocalStorage();
            refreshTable();
            $("#movieModal").dialog("close");
        }
    });
});

function saveToLocalStorage() {
    localStorage.setItem('theaterData', JSON.stringify(theaterData));
}

function formatMovies(d) {
    if (d.movies.length === 0) return '<div style="padding:10px">No movies added.</div>';
    let rows = '';
    let totalFull = 0;
    let totalDisc = 0;
    d.movies.forEach((m, index) => {
        const discPrice = m.price * (1 - (m.discount / 100));
        totalFull += m.price;
        totalDisc += discPrice;
        const hours = Math.floor(m.duration / 60);
        const minutes = m.duration % 60;
        const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        rows += `<tr>
            <td>${index + 1}- ${m.title}</td>
            <td>${m.genre}</td>
            <td>${m.releaseDate}</td>
            <td>${durationStr}</td>
            <td>₹${m.price.toFixed(2)}</td>
            <td>₹${discPrice.toFixed(2)}</td>
            <td>
                <button onclick="editMovie('${d.id}', '${m.id}')">Edit</button>
                <button onclick="deleteMovie('${d.id}', '${m.id}')">Delete</button>
            </td>
        </tr>`;
    });
    return `<table class="child-table">
        <thead>
            <tr>
                <th>Movie</th>
                <th>Genre</th>
                <th>Release</th>
                <th>Duration</th>
                <th>Price</th>
                <th>After Discount</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
            <tr class="footer-totals">
                <td colspan="4">Totals:</td>
                <td>₹${totalFull.toFixed(2)}</td>
                <td>₹${totalDisc.toFixed(2)}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>`;
}

function openTheaterModal() {
    $("#theaterForm")[0].reset();
    $("#theaterId").val("");
    $(".error").text("");
    $("#theaterModal").dialog({ modal: true, width: 400 });
}

function openMovieForm(tId) {
    $("#movieForm")[0].reset();
    $("#targetTheaterId").val(tId);
    $("#movieId").val("");
    $("#genre").val("Action");
    $("#movieModal").dialog({ modal: true, width: 500 });
}

function editMovie(tId, mId) {
    const theater = theaterData.find(t => t.id === tId);
    const movie = theater.movies.find(m => m.id === mId);
    $("#targetTheaterId").val(tId);
    $("#movieId").val(mId);
    $("#movieTitle").val(movie.title);
    $("#movieDesc").val(movie.desc);
    $("#genre").val(movie.genre);
    $("#releaseDate").val(movie.releaseDate);
    $("#duration").val(movie.duration);
    $("#ticketPrice").val(movie.price);
    $("#discount").val(movie.discount);
    $("#movieActive").prop("checked", movie.active);
    $("#movieModal").dialog({ modal: true, width: 500 });
}

function validateTheater() {
    let valid = true;
    $(".error").text("");
    if (!/^[a-zA-Z\s]+$/.test($("#theaterName").val())) { $("#errTheaterName").text("Alphabets only"); valid = false; }
    if (!$("#location").val().match(/^[a-z0-9\s]+$/i)) { $("#errLocation").text("Alphanumeric only"); valid = false; }
    if ($("#totalScreens").val() < 1) { $("#errScreens").text("Min 1 screen required"); valid = false; }
    if (!$("#launchDate").val()) { $("#errLaunchDate").text("Required"); valid = false; }
    return valid;
}

function validateMovie() {
    let valid = true;
    $(".error").text("");
    if (!/^[a-zA-Z\s]+$/.test($("#movieTitle").val())) { $("#errMovieTitle").text("Alphabets only"); valid = false; }
    if (!$("#movieDesc").val()) { $("#errMovieDesc").text("Required"); valid = false; }
    if (!$("#releaseDate").val()) { $("#errReleaseDate").text("Required"); valid = false; }
    if ($("#duration").val() <= 0) { $("#errDuration").text("Greater than 0"); valid = false; }
    if ($("#ticketPrice").val() <= 0) { $("#errTicketPrice").text("Must be positive"); valid = false; }
    if ($("#discount").val() > 30) { $("#errDiscount").text("Max 30%"); valid = false; }
    return valid;
}

function editTheater(id) {
    const t = theaterData.find(t => t.id === id);
    $("#theaterId").val(t.id);
    $("#theaterName").val(t.name);
    $("#location").val(t.location);
    $("#totalScreens").val(t.screens);
    $("#theaterActive").prop("checked", t.active);
    $("#launchDate").val(t.launchDate);
    $("#theaterModal").dialog({ modal: true, width: 400 });
}

function deleteTheater(id) {
    if (confirm("Are you sure you want to delete this theater?")) {
        theaterData = theaterData.filter(t => t.id !== id);
        saveToLocalStorage();
        refreshTable();
    }
}

function deleteMovie(tId, mId) {
    const theater = theaterData.find(t => t.id === tId);
    theater.movies = theater.movies.filter(m => m.id !== mId);
    saveToLocalStorage();
    refreshTable();
}

function refreshTable() {
    table.clear().rows.add(theaterData).draw();
}
