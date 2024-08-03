const char MAIN_page[] PROGMEM = R"=====(
<!DOCTYPE html>
<html>
<body>
<center>
<h2>WIFI Setting<h2>
<form action="/wifi_save_manual">
  Ssid name:<br>
  <input type="text" name="ssid" placeholder="ssid name">
  <br>
  Password:<br>
  <input type="text" name="pass" placeholder="password">
  <br><br>
  <input type="submit" value="Submit">
</form> 
</center>
</body>
</html>
)=====";


void HTTP_init(void) {

  HTTP.on("/", []() {
    if (!HTTP.authenticate(www_username, www_password)) {
      return HTTP.requestAuthentication();
    }
    String wifi_set_page = MAIN_page; //Read HTML contents
    HTTP.send(200, "text/html", wifi_set_page); //Send web page
  });

  HTTP.on("/wifi_save_manual", []() {                  // обработка http запроса сохранения wifi

    String ssid = HTTP.arg("ssid");
    String pass = HTTP.arg("pass");
    HTTP.sendHeader("Location", "/");
    HTTP.send(302, "text/plain", "Updated-- Press Back Button");
    WiFi.begin(ssid, pass);
  });

}
