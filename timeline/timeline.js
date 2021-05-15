
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
const default_duration = 24*60*60*1000;
const default_step = 60*60*1000;
const default_background_color_a = "#99ccff";
const default_background_color_b = "#99ccee";
const default_color_max = 100;

const fix_command_pattern_time = /\/fix (\d\d):(\d\d)/;
const fix_command_pattern_date = /\/fix (\d\d:\d\d \d\d\d\d-\d\d-\d\d)/;

let all_tags = [];
let all_tags_by_id = {"end_tags": {}};

const commands_functions = {
    "/fix": command_fix,
    "/info": command_ignore,
    "/e": command_e,
    "/end": command_ignore,
    "/tags_status": command_ignore,
    "/clean": command_ignore
};

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
    fix_no_end(tags);

    tags.sort(function (a, b) {return b.timestamp_end - a.timestamp_end});
    let last_timestamp = get_last_timestamp(tags);

    tags.sort(function (a, b) {return a.timestamp_start - b.timestamp_start});
    let first_timestamp = get_first_timestamp(tags);

    let duration = last_timestamp-first_timestamp;
    let duration_hours = duration/1000/60/60;

    append_tags(tags, first_timestamp, duration);

    generate_scale(first_timestamp, last_timestamp, default_step);

    set_background(duration_hours);

    set_body_size(duration_hours*default_scale);
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
    if (command.tag === "/e" || command.tag === "/fix") {
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
    for (let i = 0; i < commands.length; i++) {
        if (commands_functions.hasOwnProperty(commands[i].tag)) {
            commands_functions[commands[i].tag](tags, tags_by_id, commands[i]);
        } else {
            command_tag(tags, tags_by_id, commands[i]);
        }
    }
}

// commands functions

function command_fix(tags, tags_by_id, command) {

    const fix_date = command.text.match(fix_command_pattern_date);
    if (fix_date) {

        const fix_timestamp = Date.parse(fix_date[1]);

        if (tags_by_id.hasOwnProperty(command.end_id)) {
            tags_by_id[command.end_id].timestamp_start = fix_timestamp;
        } else {
            tags_by_id[tags_by_id.end_tags[command.end_id].end_id].timestamp_end = fix_timestamp;
        }

        return;
    }

    const fix_time = command.text.match(fix_command_pattern_time);
    if (fix_time) {

        if (tags_by_id.hasOwnProperty(command.end_id)) {
            const fix_date = new Date(tags_by_id[command.end_id].timestamp_start);
            tags_by_id[command.end_id].timestamp_start = fix_date.setHours(fix_time[1], fix_time[2], 0);

        } else {
            const fix_date = new Date(tags_by_id[tags_by_id.end_tags[command.end_id].end_id].timestamp_end);
            tags_by_id[tags_by_id.end_tags[command.end_id].end_id].timestamp_end = fix_date.setHours(fix_time[1], fix_time[2], 0);

        }
        return;
    }

    if (tags_by_id.hasOwnProperty(command.end_id)) {
        tags_by_id[command.end_id].text += ("[" + command.text + "]");
    } else {
        tags_by_id[tags_by_id.end_tags[command.end_id].end_id].text += ("[" + command.text + "]");
    }
}

function command_e(tags, tags_by_id, command) {
    if (!tags_by_id.hasOwnProperty(command.end_id)) {
        // TODO show warning and add placeholder
        return;
    }
    tags_by_id[command.end_id].timestamp_end = command.timestamp_start;
    tags_by_id.end_tags[command.id] = command;
}

function command_tag(tags, tags_by_id, command) {
    tags.push(command);
    tags_by_id[command.id] = command;
}

function command_ignore(tags, tags_by_id, command) {
    // ignored
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

        let element_date = document.createElement("div");
        let element_time = document.createElement("div");

        element_date.innerText = timestamp_date.toLocaleString(default_locale, default_date_options);
        element_time.innerText = timestamp_date.toLocaleString(default_locale, default_time_options);

        scale_date.appendChild(element_date);
        scale_time.appendChild(element_time);
    }
}

function fix_no_end(tags) {
    for (let i = 0; i < tags.length; i++) {
        if (!tags[i].hasOwnProperty("timestamp_end")) {
            tags[i].timestamp_end = tags[i].timestamp_start + default_duration;
        }
    }
}

// this function requieres the tags array to be sorted
// in descending order by timestamp_end
function get_last_timestamp(tags) {
    let timestamp = tags[0].timestamp_end;
    let timestamp_date = new Date(timestamp);
    timestamp_date.setSeconds(0);
    timestamp_date.setMinutes(0);
    timestamp_date.setHours(0);
    timestamp_date.setDate(timestamp_date.getDate()+1);
    return timestamp_date.getTime();
}

// this function requieres the tags array to be sorted
// in ascending order by timestamp_start
function get_first_timestamp(tags) {
    let timestamp = tags[0].timestamp_start;
    let timestamp_date = new Date(timestamp);
    timestamp_date.setSeconds(0);
    timestamp_date.setMinutes(0);
    timestamp_date.setHours(0);
    return timestamp_date.getTime();
}

function append_tags(tags, first_timestamp, duration) {
    let log = document.getElementById("log");
    log.innerHTML = "";
    let unit_length = 100/duration;
    let colors = {};

    for (let i = 0; i < tags.length; i++) {
        let entry = document.createElement("div");
        entry.innerText = tags[i].text;
        entry.className = "log_entry";
        entry.style.backgroundColor = get_tag_color(colors, tags[i].tag);
        entry.style.left = (tags[i].timestamp_start - first_timestamp)*unit_length + "%";
        entry.style.width = (tags[i].timestamp_end - tags[i].timestamp_start)*unit_length + "%";
        log.appendChild(entry);
    }
}

function get_tag_color(colors, tag) {
    if (!colors.hasOwnProperty(tag)) {
        colors[tag] = generate_color();
    }
    return colors[tag];
}

function generate_color() {
    return "#" +
        Math.floor(Math.random()*default_color_max).toString().padStart(2, "0") +
        Math.floor(Math.random()*default_color_max).toString().padStart(2, "0") +
        Math.floor(Math.random()*default_color_max).toString().padStart(2, "0");
}

function set_body_size(size) {
    let body = document.getElementById("body");
    body.style.width = size + "px";
}

function set_background(duration_hours) {
    let log = document.getElementById("log");
    log.style.background = "repeating-linear-gradient(90deg, " +
        default_background_color_a + ", " +
        default_background_color_a + " " + (100/duration_hours) + "%, " +
        default_background_color_b + " " + (100/duration_hours) + "%, " +
        default_background_color_b + " " + (100/duration_hours*2) + "%)";
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

function horizontal_scroll(event) {
    event.preventDefault();
    window.scrollBy(event.deltaY, 0);
}

document.getElementById("log").onwheel = horizontal_scroll;

// TODO consistency checks, start < end
// TODO check fix times and DST
