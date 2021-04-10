
const data_file_url = "data.json";
const default_locale = "es-ES";
const default_date_options = {
    day: "2-digit",
    weekday: "short",
    month: "short",
    year: "2-digit"
};
const default_time_options = {
    hour: "2-digit",
    minute: "2-digit"
};
// px per hour
const default_scale = 100;

let all_tags = [];
let all_tags_by_id = {};

main(all_tags, all_tags_by_id);
function main(tags, tags_by_id) {
    get_data(tags, tags_by_id);
}

function get_data(tags, tags_by_id) {
    const data_request = new XMLHttpRequest();
    data_request.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            const data = JSON.parse(this.responseText);
            data_received(data, tags, tags_by_id);
        }
    }
    data_request.open("GET", data_file_url, true);
    data_request.send();
}

function data_received(data, tags, tags_by_id) {
    let commands = get_commands(data);
    process_commands(tags, tags_by_id, commands);
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
    command.timestamp_start = Date.parse(msg.date);
    command.fix_start = false;
    command.fix_end = false;
    command.tag = msg.text[0].text;
    command.text = get_text(msg.text);
    if (command.tag === "/e") {
        command.end_id = msg.reply_to_message_id;
    }
    return command;
}

function get_text(t) {
    let text = "";
    for (let i = 0; i < t.length; i++) {
        if (typeof t[i] === "object") {
            text += t[i].text;
        } else {
            text += t[i];
        }
    }
    return text;
}

function process_commands(tags, tags_by_id, commands) {

}

function generate_scale(timestamp_start, timestamp_end, step) {
    // get scale elements
    let scale_date = document.getElementById("scale_date");
    let scale_time = document.getElementById("scale_time");

    // clear contents
    scale_date.innerHTML = "";
    scale_time.innerHTML = "";

    // generate timestamps
    for (let timestamp = timestamp_start; timestamp < timestamp_end; timestamp+=step) {
        let timestamp_date = new Date(timestamp);
        console.log(timestamp_date.toLocaleString(default_locale, default_date_options));
        console.log(timestamp_date.toLocaleString(default_locale, default_time_options));
    }

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
