
const data_file_url = "data.json"

// px per hour
const default_scale = 100;

function main() {
    get_data();
}
main();

function get_data() {
    const data_request = new XMLHttpRequest();
    data_request.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            const data = JSON.parse(this.responseText);
            data_received(data);
        }
    }
    data_request.open("GET", data_file_url, true);
    data_request.send();
}

function data_received(data) {
    console.log(JSON.stringify(data))
    console.log(data.test)
}

function generate_scale(start, end, step) {
    // get scale elements

    // clear contents

    // set style
}