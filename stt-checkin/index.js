const request  = require('request');
const consola = require('consola');
const schedule = require("node-schedule");
const user = require("./user")
class Checkin {
  constructor(email, passwd, token) {
    this.email = email;
    this.passwd = passwd;
    this.token = token;
  }
  run() {
    request.post("https://sttlink.com/auth/login", {
      json: {
        email: this.email,
        passwd: this.passwd
      }
    },  (err, res, body) => {
      if (!err) {
        consola.success(body);
        if(body.ret === 1) {
          this.checkin(res.headers["set-cookie"])
        } else {
          this.push("登录失败", body);
        }
      }
    })
  }
  checkin(cookies) {
    request.post("https://sttlink.com/user/checkin", {
      headers: {
        "Cookie": cookies
      }
    },  (err, res, body) =>{
      if (!err) {
        body = JSON.parse(body)
        consola.success(body)
        this.push("签到结果",body.msg);
      }
    })
  }
  push(title, content) {
    if(!this.token) return;
    consola.start("开始推送")
    request.post(`http://pushplus.hxtrip.com/send`, {
      json: {
        token: this.token,
        title,
        content,
        template: "json"
      }
    }, function (err, res, body) {
      if (!err) {
        consola.success(body)
      }
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
// * * * * * *
// 秒、分、时、日、月、周几
schedule.scheduleJob("30 5 0 * * *", () => {
  consola.info("执行时间：" + new Date())
  user.forEach(item => {
    createCheckin(item.email, item.passwd, item.token || "").run();
  })
})
