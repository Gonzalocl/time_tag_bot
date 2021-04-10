
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

let all_tags = [];
let all_tags_by_id = {};

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
    tags.sort(function (a, b) {return a.timestamp_start - b.timestamp_start});
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
        if (commands[i].tag in commands_functions) {
            commands_functions[commands[i].tag](tags, tags_by_id, commands[i]);
        } else {
            command_tag(tags, tags_by_id, commands[i]);
        }
    }
}

// commands functions

function command_fix(tags, tags_by_id, command) {
    console.log("fix" + command.tag);
}

function command_e(tags, tags_by_id, command) {
    tags_by_id[command.end_id].timestamp_end = command.timestamp_start;
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
        console.log(timestamp_date.toLocaleString(default_locale, default_date_options));
        console.log(timestamp_date.toLocaleString(default_locale, default_time_options));
    }

    // set style
}

function fix_no_end(tags) {
    for (let i = 0; i < tags.length; i++) {
        if (!tags[i].hasOwnProperty("timestamp_end")) {
            tags[i].timestamp_end = tags[i].timestamp_start + default_duration;
        }
    }
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
