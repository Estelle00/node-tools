const request  = require('request');
const consola = require('consola');
const schedule = require("node-schedule");
const user = require("./user");
const domain = "https://sttlink.net"
class Checkin {
  constructor(email, passwd, token) {
    this.email = email;
    this.passwd = passwd;
    this.token = token;
  }
  run() {
    request.post(domain + "/auth/login", {
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
      } else {
        consola.error(err);
        this.push("登录失败", err);
      }
    })
  }
  checkin(cookies) {
    request.post(domain + "/user/checkin", {
      headers: {
        "Cookie": cookies
      }
    },  (err, res, body) =>{
      if (!err) {
        body = JSON.parse(body)
        consola.success(body)
        this.push("签到结果",body.msg);
      } else {
        consola.error(err);
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
