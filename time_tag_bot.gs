
/*
Publish > Deploy as web app...
- New
- Me
- Anyone, even anonymous
*/
var bot_url = '';
var token = '';
var telegram_api_url = 'https://api.telegram.org/bot';
var error_chat_id = 12345;

function doPost(e) {
  var update = JSON.parse(e.postData.contents);
  pin_chat_message(update.message.chat.id, update.message.message_id);
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
    'payload': JSON.stringify(payload)
  };
  
  var response = UrlFetchApp.fetch(telegram_api_url + token + '/' + method, params);
    
  if (response.getResponseCode() == 200) {
    return JSON.parse(response.getContentText());
  } else {
    log_msg('ERROR: telegram_api_call', [method, payload, response]);
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
    'payload': JSON.stringify({
      'chat_id': error_chat_id,
      'text': JSON.stringify(log_tag)
    })
  };
  UrlFetchApp.fetch(telegram_api_url + token + '/sendMessage', params);

  // TODO format monospace
  params = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify({
      'chat_id': error_chat_id,
      'parse_mode': 'HTML',
      'text': JSON.stringify(msg)
    })
  };
  UrlFetchApp.fetch(telegram_api_url + token + '/sendMessage', params);
}

