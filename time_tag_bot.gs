
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
  error_msg(e);
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
  }
  
  return false;
}

function send_message(chat_id, text) {
  telegram_api_call('sendMessage', {
    'chat_id': chat_id,
    'text': text
  });
}

function error_msg(msg) {
  send_message(error_chat_id, 'ERROR');
  telegram_api_call('sendMessage', {
    'chat_id': error_chat_id,
    'parse_mode': 'HTML',
    'text': JSON.stringify(msg)
  });
}

