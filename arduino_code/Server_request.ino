void Deno_request(void) {
  if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      client.setFingerprint(fingerprint);
      HTTPClient http;
      http.begin(client, serverName);
  
      // Устанавливаем заголовки и тип данных
      http.addHeader("Content-Type", "application/json");
  
      // Подготовка данных для отправки
      //{\"street_temp\": temp1, \"home_temp\": temp2}
        String jsonData = "";
        jsonData += "{\"street_temp\":";
        jsonData += temp1;
        jsonData += ", \"home_temp\":";
        jsonData += temp2;
        jsonData += "}";
        
      // Отправка HTTP POST запроса
      int httpResponseCode = http.POST(jsonData);
  
      // Печать HTTP кода ответа
      /*if (httpResponseCode > 0) {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        String payload = http.getString();
        Serial.println("Response payload: ");
        Serial.println(payload);
      } else {
        Serial.print("Error on sending POST: ");
        Serial.println(httpResponseCode);
        Serial.println(http.errorToString(httpResponseCode).c_str());
      }*/
  
      // Закрываем соединение
      http.end();
    }
}
