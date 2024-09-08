const char MAIN_page[] PROGMEM = R"=====(
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .container {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
      width: 100%;
      max-width: 400px;
      box-sizing: border-box;
    }
    h2 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    input[type="text"] {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    input[type="submit"] {
      background-color: #007BFF;
      color: #fff;
      border: none;
      padding: 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    input[type="submit"]:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>WIFI Setting</h2>
    <form action="/wifi_save_manual">
      <label for="ssid">Ssid name:</label>
      <input type="text" id="ssid" name="ssid" placeholder="SSID name" required>
      
      <label for="pass">Password:</label>
      <input type="text" id="pass" name="pass" placeholder="Password" required>
      
      <input type="submit" value="Submit">
    </form>
  </div>
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
