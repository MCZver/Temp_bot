void HTTP_init(void) {
  HTTP.on("/", []() {
    if (!HTTP.authenticate(www_username, www_password)) {
      return HTTP.requestAuthentication();
    }
    HTTP.send(200, "text/plain", "Login OK");
  });

}
