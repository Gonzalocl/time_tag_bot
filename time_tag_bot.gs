
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
    var message_id = update.message.message_id;
    if (command == '/e') {
      command_e();
    } else if (command == '/end') {
      command_end();
    } else {
      command_tag();
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
    log_msg('LOG: no message field', update);
    return false;
  }
  return true;
}

function command_tag() {
  log_msg('LOG: tag', {});
}

function command_e() {
  log_msg('LOG: e', {});
}

function command_end() {
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
    log_msg('ERROR: telegram_api_call', [method, response.getResponseCode(), response.getContentText(), payload]);
    return false;
  }
}

function send_message(chat_id, text) {
  return telegram_api_call('sendMessage', {
    'chat_id': chat_id,
    'text': text
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

