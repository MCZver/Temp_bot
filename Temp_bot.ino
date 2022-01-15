#include <Arduino.h>
#include "AsyncTelegram.h"
#include "uptime.h"
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPUpdateServer.h>
#include <microDS18B20.h>
#include <WiFiUdp.h>

ESP8266WebServer HTTP(80);
ESP8266HTTPUpdateServer httpUpdater;
AsyncTelegram myBot;

const char* token = "5031122379:AAFzszfP0M4kkYhzYVZ800bGBeUlYPJ1EP0";
const char* www_username = "Esp_TempBot";
const char* www_password = "5031122379";

uint8_t s1_addr[] = {0x28, 0xFE, 0xB0, 0x75, 0xD0, 0x1, 0x3C, 0xD9};    //Уличный датчик
uint8_t s2_addr[] = {0x28, 0x8A, 0x3, 0x75, 0xD0, 0x1, 0x3C, 0x9C};     //Домашний датчик

String temp1 = "";
String temp2 = "";
int curent_temp1_int, curent_temp2_int;
unsigned int localPort = 2000; // local port to listen for UDP packets
char packetBuffer[9];

IPAddress SendIP(192,168,50,255);
WiFiUDP udp;
MicroDS18B20<2, s1_addr> sensor1;  // Уличный датчик
MicroDS18B20<2, s2_addr> sensor2;  // Домашний датчик

void setup() {
  pinMode(1, OUTPUT);

  myBot.setClock("CET-1CEST,M3.5.0,M10.5.0/3");
  myBot.setUpdateTime(500);
  myBot.setTelegramToken(token);

  httpUpdater.setup(&HTTP);

  HTTP.begin();
  myBot.begin();
  udp.begin(localPort);
  HTTP_init();

}

void loop() {

  HTTP.handleClient();
  uptime::calculateUptime();
  Sensor_data();
  TG_init();
}

String IpAddress2String(const IPAddress& ipAddress) {
  return String(ipAddress[0]) + String(".") + \
         String(ipAddress[1]) + String(".") + \
         String(ipAddress[2]) + String(".") + \
         String(ipAddress[3])  ;
}
