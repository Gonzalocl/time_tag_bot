
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
    log_msg('ERROR: doPost: exception', [error,  e]);
  }
}

function new_update(update) {
  if (check_update(update)) {
    var command = get_command(update);
    if (!command) {
      log_msg('ERROR: no command found', update);
      
    } else if (command == '/e') {
      if (!update.message.hasOwnProperty('reply_to_message')) {
        log_msg('ERROR: command /e without replay', update);
        return;
        
      }
      command_e(update);
      
    } else if (command == '/end') {
      command_end(update);
      
    } else {
      command_tag(update);
      
    }
  }
}

function get_command(update) {
  for (entity in update.message.entities) {
    if (update.message.entities[entity].offset == 0) {
      return update.message.text.substring(0, update.message.entities[entity].length);
    }
  }
}

function check_update(update) {
  if (!update.hasOwnProperty('message')) {
    log_msg('ERROR: no message field', update);
    return false;
  }
  return true;
}

function command_tag(update) {
  var response = pin_chat_message(update.message.chat.id, update.message.message_id);
  var tags_status = new_active_tag(chatupdate.message.chat.id_id,
                                   update.message.message_id,
                                   update.message.text)
}

function command_e(update) {
  var response = unpin_chat_message(update.message.chat.id,
                                    update.message.reply_to_message.message_id);
}

function command_end(update) {
  log_msg('LOG: end', {});
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
  
  if (!tags_status[chat_id]) {
    tags_status[chat_id] = {'active_tags': [], 'recent_tags': []}
  }
  
  tags_status[chat_id].active_tags.push({'message_id': message_id, 'tag': tag});
  tags_status[chat_id].recent_tags.push(tag);
  
  var keyboard_buttons = get_custom_keyboard_buttons(tags_status[chat_id]);
  set_custom_keyboard(chat_id, '.', keyboard_buttons)
  
  propertiesService.setProperty(tags_status_key, JSON.stringify(tags_status));
  return tags_status;
}

function end_active_tag(chat_id, message_id) {
  var propertiesService = PropertiesService.getScriptProperties();
  var tags_status = JSON.parse(propertiesService.getProperty(tags_status_key));
  
  
  
  
  propertiesService.setProperty(tags_status_key, JSON.stringify(tags_status));
  return tags_status;
}

function get_custom_keyboard_buttons(tags_status) {
  var keyboard_buttons = [];
  for (tag in tags_status.active_tags) {
    keyboard_buttons.push('/end ' +
                          tags_status.active_tags[tag].message_id +
                          ' ' +
                          tags_status.active_tags[tag].tag);
  }
  return [keyboard_buttons];
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

function debug_doPost() {
  var e = {};
  doPost(e);
}

