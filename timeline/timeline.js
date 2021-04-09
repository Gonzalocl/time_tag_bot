
const data_file_url = "data.json";

// px per hour
const default_scale = 100;

let tags = [];
let tags_by_id = {};

main();
function main() {
    get_data();
}

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
    let commands = get_commands(data);
    for (let i = 0; i < commands.length; i++) {
        console.log(commands[i].text);
        console.log(commands[i].tag);
    }
    process_commands(commands);
}

function get_commands(data) {

    check_property(data, "messages");

    let messages = data.messages.filter(function (msg) {
        return msg.type === "message";
    });

    let commands = [];
    for (let i = 0; i < messages.length; i++) {
        commands.push(get_command(messages[i]));
    }

    return commands;
}

function get_command(msg) {
    let command = {};
    command.id = msg.id;
    command.timestamp = msg.date;
    command.tag = msg.text[0].text;
    command.text = get_text(msg.text);
    return command;
}

function get_text(t) {
    let text = "";
    for (let i = 0; i < t.length; i++) {
        // text += t[i];
    }
    return text;
}

function process_commands(commands) {

}

function generate_scale(start, end, step) {
    // get scale elements

    // clear contents

    // set style
}

function check_property(obj, property) {
    if (!obj.hasOwnProperty(property)) {
        error_msg("Property error: " + property, obj);
        throw new Error("Property error: " + property);
    }
}

function error_msg(msg, obj) {
    document.getElementsByTagName("body")[0].innerHTML = msg + "<br><br>" + JSON.stringify(obj);
}
