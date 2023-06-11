import fs from 'fs/promises'
import { exec } from 'child_process'
import { platform } from 'os'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { dirname, sep } from 'path'
import { createTransport } from 'nodemailer'
import config from './config.json' assert { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

const execPromisify = promisify(exec)

;(async () => {
  if (platform() !== 'linux')
    return console.log('unsupported operating system')

  try {
    await execPromisify('type vnstat')
  } catch (e) {
    return console.log('unable to find vnstat command')
  }

  // every five minutes
  setInterval(() => check(), 300000)
})()

async function check () {
  const notified = await readNotified()

  const vnstat = await execPromisify('vnstat --json')

  // 指定接口的流量
  let thisInterface
  try {
    thisInterface = JSON.parse(vnstat.stdout.trim()).interfaces.find(i => i.name === config.interface)
  } catch (e) {
    return  console.log('malformed output')
  }

  if (!thisInterface)
    return console.log('no specified network interface')

  const traffic = thisInterface.traffic
  const fiveminute = traffic.fiveminute[traffic.fiveminute.length - 1]
  const hour = traffic.hour[traffic.hour.length - 1]

  const fiveminuteTotal = (fiveminute.rx + fiveminute.tx) / 1048576
  if (fiveminuteTotal > config.fiveminute) {
    // 超出限制
    if (notified.includes('fiveminute_' + fiveminute.timestamp)) {
      // 已发送邮件
      return
    }

    notified.push('fiveminute_' + fiveminute.timestamp)
    await sendMail(`${config.server} traffic warning`, `${fiveminuteTotal.toFixed(2)}MB of traffic has been reached within five minutes`)
    await writeNotified(notified)
  }

  const hourTotal = (hour.rx + hour.tx) / 1048576
  if (hourTotal > config.hour) {
    // 超出限制
    if (notified.includes('hour_' + hour.timestamp)) {
      // 已发送邮件
      return
    }

    notified.push('hour_' + hour.timestamp)
    await sendMail(`${config.server} traffic warning`, `${hourTotal.toFixed(2)}MB of traffic has been reached within one hour`)
    await writeNotified(notified)
  }
}

async function readNotified () {
  try {
    const j = await fs.readFile(__dirname + sep + 'notified.json', 'utf-8')
    return JSON.parse(j)
  } catch (e) {
    return []
  }
}

async function writeNotified (notified) {
  try {
    await fs.writeFile(__dirname + sep + 'notified.json', JSON.stringify(notified), 'utf8')
  } catch (e) {
    console.log(e)
  }
}

/**
 * send an email
 *
 * @param subject
 * @param html
 * @returns {Promise<boolean>}
 */
async function sendMail (subject, html) {
  const transporter = createTransport(config.mail.transporter)

  const message = { from: config.mail.from, to: config.mail.to, subject, html }

  try {
    await transporter.sendMail(message)
    return true
  } catch (e) {
    console.log(e)
    return false
  }
}