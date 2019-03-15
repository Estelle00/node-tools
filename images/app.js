const path = require("path");
const images = require("images");
const glob = require("glob");
const request = require("request");
const fs = require("fs");
const chalk = require("chalk");
const consola = require("consola");
const {SOURCE, OUTPUT, MAX_SIZE} = require("./config/index");
const fails = [];
const failsInfo = [];

const files = glob.sync("*", {
  cwd: SOURCE
});
const len = files.length;
function run() {
  console.log();
  if (files[0]) {
    prefixer(files[0], true);
  } else if (fails[0]) {
    prefixer(fails[0], false);
  } else {
    const failsLen = failsInfo.length;
    consola.info(`error: ${failsLen}, success: ${len - failsLen}`);
    if (failsLen > 0) {
      console.table(failsInfo);
    }
    consola.info("end");
    process.exit(0);
  }
}
function prefixer(filename, first) {
  if (first) {
    files.shift();
  } else {
    fails.shift();
  }
  const filePath = path.resolve(__dirname, SOURCE, filename);
  const sourceSize = fs.statSync(filePath).size;
  const img = images(filePath); //Load image from file
  let w = img.width();
  let h = img.height();
  let x = 0;
  let y = 0;
  let size = h;
  if (w > h) {
    size = w;
    y = (w - h) / 2;
  } else {
    size = h;
    x = (h - w) / 2;
  }
  const newImg = images(size, size)
    .fill(255, 255, 255)
    .draw(img, x, y);
  if (MAX_SIZE > 0 && size > MAX_SIZE) {
    newImg.resize(MAX_SIZE);
  }
  const b = newImg.encode("jpg");
  const newFilename = path.parse(filename).name + ".jpg";
  const savePath = path.resolve(__dirname, OUTPUT, newFilename);
  if (fs.existsSync(savePath)) {
    consola.info(`${newFilename}文件已存在，跳过${filename}的压缩！`);
    run();
  } else {
    consola.start("tinypng start:", filename);
    tinypng(b, function(data, error) {
      if (data) {
        fs.writeFileSync(savePath, data);
        const outputSize = fs.statSync(savePath).size;
        const ratio = outputSize / sourceSize;
        consola.success(
          filename + chalk.green(`(${(ratio * 100).toFixed(1)}%)`)
        );
      } else {
        if (first) {
          consola.fatal(`${filename} 处理异常，稍后自动重试！`);
          fails.push(filename);
        } else {
          failsInfo.push({
            filename,
            error
          });
          consola.fatal(`${filename}文件重新处理失败，请手动处理！`);
        }
      }
      run();
    });
  }
}
function tinypng(file, callback) {
  request(
    "https://tinypng.com/web/shrink",
    {
      method: "post",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Connection: "keep-alive",
        Host: "tinypng.com",
        DNT: 1,
        Referer: "https://tinypng.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0"
      },
      body: file
    },
    function(error, response, body) {
      if (!error) {
        try {
          const results = JSON.parse(body);
          if (results.output && results.output.url) {
            request.get({ url: results.output.url, encoding: null }, function(
              err,
              res,
              body
            ) {
              callback(err ? null : Buffer.from(body), err);
            });
          } else {
            consola.fatal("接口异常");
            process.exit(0);
          }
        } catch (e) {
          callback(null, e);
        }
      } else {
        callback(null, error);
      }
    }
  );
}
run();
