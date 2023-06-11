# network-traffic-alert

A simple way to send an email when network traffic is high.

1. install vnstat and nodejs

```sh
apt install vnstat
apt install nodejs
```

2. clone the project

```sh
git clone https://github.com/helenbaran2002/network-traffic-alert.git
```

3. install nodejs package

```sh
cd network-traffic-alert
npm install
```

4. change config.json to what you what

```json
{
  "server": "fade",
  "interface": "eth0",
  "fiveminute": 256,
  "hour": 2048,
  "mail": {
    "transporter": {
      "host": "smtp.abc.com",
      "port": 465,
      "secure": true,
      "auth": {
        "user": "",
        "pass": ""
      }
    },
    "from": "",
    "to": ""
  }
}
```

If traffic exceeds 256MB in five minutes or 2048MB in one hour,  it will send an email to "mail.to".

5. run index.mjs

```sh
node index.mjs
```

or run it in the background

```sh
nohup node index.mjs > log.txt 2> log.txt &
```