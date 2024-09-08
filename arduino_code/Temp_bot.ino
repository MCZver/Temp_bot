#include <Arduino.h>
#include "AsyncTelegram.h"
#include "uptime.h"
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPUpdateServer.h>
#include <microDS18B20.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include "GyverTimer.h"

#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>

GTimer request_timer(MS);
ESP8266WebServer HTTP(80);
ESP8266HTTPUpdateServer httpUpdater;
AsyncTelegram myBot;

const char* token = "5031122379:AAFzszfP0M4kkYhzYVZ800bGBeUlYPJ1EP0";
const char* ota_hostname = "TempBot";
const char* ota_password = "tempbotupdate";
const char* www_username = "Esp_TempBot";
const char* www_password = "5031122379";

const char* serverName = "https://max-test-80.deno.dev/data"; // Убедитесь, что это правильный URL
const char* fingerprint = "7D:81:8F:57:34:71:A5:3B:9A:18:C4:D0:D9:72:63:DA:5D:5F:9E:D7"; // Замените на реальный отпечаток

uint8_t s1_addr[] = {0x28, 0xFE, 0xB0, 0x75, 0xD0, 0x1, 0x3C, 0xD9};    //Уличный датчик
uint8_t s2_addr[] = {0x28, 0x8A, 0x3, 0x75, 0xD0, 0x1, 0x3C, 0x9C};     //Домашний датчик

String temp1 = "";
String temp2 = "";
int curent_temp1_int, curent_temp2_int;
//unsigned int localPort = 2000; // local port to listen for UDP packets
//char packetBuffer[9];

//IPAddress SendIP(192,168,50,255);
//WiFiUDP udp;
MicroDS18B20<2, s1_addr> sensor1;  // Уличный датчик
MicroDS18B20<2, s2_addr> sensor2;  // Домашний датчик

void setup() {
  pinMode(1, OUTPUT);
  request_timer.setInterval(60000);
  
  myBot.setClock("CET-1CEST,M3.5.0,M10.5.0/3");
  myBot.setUpdateTime(500);
  myBot.setTelegramToken(token);

  httpUpdater.setup(&HTTP);

  HTTP.begin();
  myBot.begin();
//  udp.begin(localPort);
  HTTP_init();

  ArduinoOTA.setHostname(ota_hostname);
  ArduinoOTA.setPassword(ota_password);
  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH) {
      type = "sketch";
    } else { // U_FS
      type = "filesystem";
    }
  });
  
  ArduinoOTA.onEnd([]() {
   //Serial.println("\nEnd");
  });
  
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    //Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  
  ArduinoOTA.onError([](ota_error_t error) {
      //Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) {
      //Serial.println("Auth Failed");
    } else if (error == OTA_BEGIN_ERROR) {
      //Serial.println("Begin Failed");
    } else if (error == OTA_CONNECT_ERROR) {
      //Serial.println("Connect Failed");
    } else if (error == OTA_RECEIVE_ERROR) {
      //Serial.println("Receive Failed");
    } else if (error == OTA_END_ERROR) {
      //Serial.println("End Failed");
    }
  });
  
  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();
  HTTP.handleClient();
  uptime::calculateUptime();
  Sensor_data();
  TG_init();
  if (request_timer.isReady()) Deno_request();
}

String IpAddress2String(const IPAddress& ipAddress) {
  return String(ipAddress[0]) + String(".") + \
         String(ipAddress[1]) + String(".") + \
         String(ipAddress[2]) + String(".") + \
         String(ipAddress[3])  ;
}
