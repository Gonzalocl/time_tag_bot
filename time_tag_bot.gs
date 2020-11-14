
/*
Publish > Deploy as web app...
- New
- Me
- Anyone, even anonymous
*/
var bot_url = '';
var token = '';
var telegram_api_url = 'https://api.telegram.org/bot';
var log_chat_id = 12345;

function doPost(e) {
  //log_msg('DEBUG', e);
  try {
    if (e.postData.type == 'application/json') {
      new_update(JSON.parse(e.postData.contents));
    } else {
      log_msg('ERROR: doPost', e);
    }
  } catch (error) {
    log_msg('ERROR: doPost: exception', [error.stack,  e]);
  }
}

var commands_functions = {
  'no_command_found': no_command_found,
  '/fix': ignore_command,
  '/info': ignore_command,
  '/e': command_e,
  '/end': command_end,
  '/tags_status': command_tags_status
};

function new_update(update) {
  if (check_update(update)) {
    var command = get_command(update);
    commands_functions[command](update);
  }
}

function get_command(update) {
  for (entity in update.message.entities) {
    if (update.message.entities[entity].offset == 0) {
      return update.message.text.substring(0, update.message.entities[entity].length);
    }
  }
  return 'no_command_found';
}

function check_update(update) {
  if (update.hasOwnProperty('edited_message')) {
    //log_msg('LOG: edited_message', update);
    return false;
  }
  if (!update.hasOwnProperty('message')) {
    log_msg('ERROR: no message field', update);
    return false;
  }
  if (update.message.hasOwnProperty('pinned_message')) {
    //log_msg('LOG: pinned_message', update);
    return false;
  }
  return true;
}

function command_tag(update) {
  var response = pin_chat_message(update.message.chat.id, update.message.message_id);
  // TODO check duplicates
  var tags_status = new_active_tag(update.message.chat.id,
                                   update.message.message_id,
                                   update.message.text);
  
  var keyboard_buttons = get_custom_keyboard_buttons(tags_status[update.message.chat.id]);
  set_custom_keyboard(update.message.chat.id, '/tags_status', keyboard_buttons);
}

function command_e(update) {
  if (!update.message.hasOwnProperty('reply_to_message')) {
    log_msg('ERROR: command /e without replay', update);
    return;
  }
  var response = unpin_chat_message(update.message.chat.id,
                                    update.message.reply_to_message.message_id);
}

function command_tags_status(update) {
  log_msg('LOG: command_tags_status not implemented', update);
}

function no_command_found(update) {
  log_msg('ERROR: no command found', update);
}

function ignore_command(update) {
  log_msg('LOG: command ignored', update);
}

var command_end_pattern = /\/end (-?\d+)/g;
function command_end(update) {
  var command_match = command_end_pattern.exec(update.message.text);
  if (command_match == null) {
    log_msg('ERROR: command /end wrong format', [command_match, update]);
    return;
  }
  
  var end_tag_message_id = command_match[1];
  
  var tags_status = end_active_tag(update.message.chat.id,
                                   end_tag_message_id);
  
  if (!tags_status) {
    log_msg('ERROR: command /end wrong end_tag_message_id', [tags_status, command_match, update]);
    return;
  }
  
  var response = unpin_chat_message(update.message.chat.id,
                                    end_tag_message_id);
  
  var keyboard_buttons = get_custom_keyboard_buttons(tags_status[update.message.chat.id]);
  set_custom_keyboard_and_replay(update.message.chat.id, end_tag_message_id, keyboard_buttons);
}

function set_custom_keyboard_and_replay(chat_id, message_id, buttons) {
  var custom_keyboard = {
    'keyboard': buttons,
    'resize_keyboard': true
  };
  var text = '/e';
  return telegram_api_call('sendMessage', {
    'chat_id': chat_id,
    'text': text,
    'reply_to_message_id': message_id,
    'reply_markup': JSON.stringify(custom_keyboard)
  });  
}

function set_webhook() {
  var response = telegram_api_call('setWebhook', {
    url: bot_url
  });
  Logger.log(JSON.stringify(response));
}

function telegram_api_call(method, payload) {
  var params = {
    'method': 'post',
    'contentType': 'application/json',
    'muteHttpExceptions': true,
    'payload': JSON.stringify(payload)
  };

  var response = UrlFetchApp.fetch(telegram_api_url + token + '/' + method, params);

  if (response.getResponseCode() == 200) {
    return JSON.parse(response.getContentText());
  } else {
    log_msg('ERROR: telegram_api_call', [method, response.getResponseCode(),
                                         response.getContentText(), payload]);
    return false;
  }
}

function send_message(chat_id, text) {
  return telegram_api_call('sendMessage', {
    'chat_id': chat_id,
    'text': text
  });
}

function set_custom_keyboard(chat_id, text, buttons) {
  var custom_keyboard = {
    'keyboard': buttons,
    'resize_keyboard': true
  };
  return telegram_api_call('sendMessage', {
    'chat_id': chat_id,
    'text': text,
    'reply_markup': JSON.stringify(custom_keyboard)
  });
}

function pin_chat_message(chat_id, message_id) {
  return telegram_api_call('pinChatMessage', {
    'chat_id': chat_id,
    'message_id': message_id
  });
}

function unpin_chat_message(chat_id, message_id) {
  return telegram_api_call('unpinChatMessage', {
    'chat_id': chat_id,
    'message_id': message_id
  });
}

function new_active_tag(chat_id, message_id, tag) {
  var propertiesService = PropertiesService.getScriptProperties();
  var tags_status = JSON.parse(propertiesService.getProperty(tags_status_key));
  
  if (!tags_status) {
    tags_status = {};
  }
  
  if (!tags_status[chat_id]) {
    tags_status[chat_id] = {'active_tags': [], 'recent_tags': []}
  }
  
  tags_status[chat_id].active_tags.push({'message_id': message_id, 'tag': tag});
  tags_status[chat_id].recent_tags.push(tag);
  
  propertiesService.setProperty(tags_status_key, JSON.stringify(tags_status));
  return tags_status;
}

function end_active_tag(chat_id, message_id) {
  var propertiesService = PropertiesService.getScriptProperties();
  var tags_status = JSON.parse(propertiesService.getProperty(tags_status_key));
  
  if (!tags_status) {
    log_msg('ERROR: no tags_status', tags_status);
    return false;
  }
  
  if (!tags_status[chat_id]) {
    log_msg('ERROR: no tags_status for chat_id', tags_status);
    return false;
  }
  
  for (tag in tags_status[chat_id].active_tags) {
    if (tags_status[chat_id].active_tags[tag].message_id == message_id) {
      tags_status[chat_id].active_tags.splice(tag, 1);
      break;
    }
  }
  
  propertiesService.setProperty(tags_status_key, JSON.stringify(tags_status));
  return tags_status;
}

function get_custom_keyboard_buttons(tags_status) {
  var keyboard_buttons = [];
  for (tag in tags_status.active_tags) {
    keyboard_buttons.push(['/end ' +
                          tags_status.active_tags[tag].message_id +
                          ' ' +
                          tags_status.active_tags[tag].tag]);
  }
  return keyboard_buttons;
}

function log_msg(log_tag, msg) {
  var params = {
    'method': 'post',
    'contentType': 'application/json',
    'muteHttpExceptions': true,
    'payload': JSON.stringify({
      'chat_id': log_chat_id,
      'text': JSON.stringify(log_tag).substring(0, 4000)
    })
  };
  UrlFetchApp.fetch(telegram_api_url + token + '/sendMessage', params);

  // TODO format monospace
  params = {
    'method': 'post',
    'contentType': 'application/json',
    'muteHttpExceptions': true,
    'payload': JSON.stringify({
      'chat_id': log_chat_id,
      'parse_mode': 'HTML',
      'text': JSON.stringify(msg).substring(0, 4000)
    })
  };
  UrlFetchApp.fetch(telegram_api_url + token + '/sendMessage', params);
}

function js_line() {
  var e = new Error();
  return e.stack.split('\n')[2];
}

function debug_doPost() {
  var e = {};
  doPost(e);
}

function debug_function() {
  
  Logger.log(PropertiesService.getScriptProperties().getProperty(tags_status_key));
  Logger.log(PropertiesService.getScriptProperties().deleteAllProperties());

}

