void TG_init(void) {                    // a variable to store telegram message data
  TBMessage msg;

  // if there is an incoming message...
  if (myBot.getNewMessage(msg)) {
    if (msg.text == "/start") {
      myBot.sendMessage(msg, "Привет! Я телеграмм-градусник 😊");
      myBot.sendMessage(msg, "Чтобы посмотреть температуру попроси моего создателя добавить тебя в список пользователей");
      myBot.sendMessage(msg, "https://t.me/zver_ukraina");
    }
    /*
       204985716 - Надя
       242446150 - Макс
    */
    if (msg.sender.id == 204985716 || msg.sender.id == 242446150) {
      if (msg.text == "/home") {

        String home_temp_str = "";
        home_temp_str += "Температура дома: ";
        home_temp_str += temp2;
        myBot.sendMessage(msg, home_temp_str);

        //        if (curent_temp1_int < 19) myBot.sendMessage(msg, "Уф... что-то холодновато :(");
        //        if (curent_temp1_int > 19 && curent_temp1_int < 25) myBot.sendMessage(msg, "Комфортно! Можно жить :)");
        //        if (curent_temp1_int > 25 && curent_temp1_int < 30) myBot.sendMessage(msg, "Тепленько! :)");
        //        if (curent_temp1_int > 30) myBot.sendMessage(msg, "Жарковато! Кажется пора доставать вентилятор!");
      }

      if (msg.text == "/street") {
        String street_temp_str = "";
        street_temp_str += "Температура на улице: ";
        street_temp_str += temp1;
        myBot.sendMessage(msg, street_temp_str);

        //        if (curent_temp1_int < 19) myBot.sendMessage(msg, "Уф... что-то холодновато :(");
        //        if (curent_temp1_int > 19 && curent_temp1_int < 25) myBot.sendMessage(msg, "Можно жить :)");
        //        if (curent_temp1_int > 25 && curent_temp1_int < 30) myBot.sendMessage(msg, "Тепленько! Можно купить мороженку!");
        //        if (curent_temp1_int > 30) myBot.sendMessage(msg, "Жарковато! Кажется на асфальте можно жарить яишенку...");
      }

      if (msg.text == "/uptime") {
        myBot.sendMessage(msg, "Я работаю беспрерывно уже...");

        String uptime_str = "";

        uptime_str += uptime::getDays();
        uptime_str += " дней,    ";
        uptime_str += uptime::getHours();
        uptime_str += " часов,   ";
        uptime_str += uptime::getMinutes();
        uptime_str += " минут,   ";
        uptime_str += uptime::getSeconds();
        uptime_str += " секунд.";

        myBot.sendMessage(msg, uptime_str);
      }

      if (msg.text == "/click") {
        myBot.sendMessage(msg, "Кликнул) Смотри...");
        digitalWrite(1, HIGH);
        delay(100);
        digitalWrite(1, LOW);
      }

//      if (msg.text == "/udp") {
//        myBot.sendMessage(msg, "UDP Send test");
//        
//        IPAddress ip = WiFi.localIP();
//        String str_ip_adres = IpAddress2String(ip);
//        int str_len = str_ip_adres.length() + 1;
//        char char_ip[str_len];
//        str_ip_adres.toCharArray(char_ip, str_len);
//
//        udp.beginPacket(SendIP, 2000);
//        udp.write(char_ip, 20);
//        udp.endPacket();
//      }
    }
  }
}

void Sensor_data(void) {
  static uint32_t tmr;
  if (millis() - tmr >= 800) {
    tmr = millis();

    if (sensor1.readTemp()) {
      temp1  = String(sensor1.getTemp(), 2);
      curent_temp1_int = sensor1.getTempInt();
    }
    if (sensor2.readTemp()) {
      temp2  = String(sensor2.getTemp(), 2);
      curent_temp2_int = sensor2.getTempInt();
    }

    sensor1.requestTemp();
    sensor2.requestTemp();
  }
}
