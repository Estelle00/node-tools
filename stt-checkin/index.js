const consola = require('consola');
const schedule = require("node-schedule");
const user = require("./user");
const axios = require("axios");
const domain = "https://sttlink.net";
const instance = axios.create({
  timeout: 10000,
  withCredentials: true
})

class Checkin {
  constructor(email, passwd, token) {
    this.email = email;
    this.passwd = passwd;
    this.token = token;
  }

  async run() {
    try {
      const {data, headers} = await instance.post(domain + "/auth/login", {
        email: this.email,
        passwd: this.passwd
      })
      if (data.ret === 1) {
        await this.checkin(headers["set-cookie"])
      } else {
        throw new Error(data.msg);
      }
    } catch (e) {
      this.push("签到失败", e.message);
      consola.error(e);
    }
  }

  async checkin(Cookie) {
    const {data} = await instance.post(domain + "/user/checkin", {}, {
      headers: {
        Cookie
      }
    })
    console.info(data);
    if (data.ret === 1) {
      this.push("签到成功", data.msg);
    } else {
      throw new Error(data.msg);
    }
  }

  push(title, content) {
    if (!this.token) return;
    consola.start("开始推送");
    instance.post("http://pushplus.hxtrip.com/send", {
      token: this.token,
      title,
      content,
      template: "json"
    }).then(res => {
      consola.success(res.data)
    }).catch(err => {
      consola.error(err)
    })
  }
}

const userMap = new Map();

function createCheckin(email, passwd, token) {
  if (userMap.get(email)) {
    return userMap.get(email);
  }
  const c = new Checkin(email, passwd, token);
  userMap.set(email, c);
  return c;
}

console.log("服务开启");

function run() {
  consola.info("执行时间：" + new Date())
  user.forEach(item => {
    createCheckin(item.email, item.passwd, item.token || "").run();
  })
}

// * * * * * *
// 秒、分、时、日、月、周几
schedule.scheduleJob("30 5 0 * * *", () => {
  run()
})
run()
