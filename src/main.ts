import * as https from "https";
import * as querystring from "querystring";
import md5 = require("md5");
import { appid, key } from "./private";

type BaiduTranslate = {
  error_code?: string;
  error_msg?: string;
  from: string;
  to: string;
  trans_result: {
    src: string;
    dst: string;
  }[];
};

type ErrorMap = {
  [key: string]: string;
};

const errorMap: ErrorMap = {
  52001: "请求超时，请重试!",
  52002: "系统错误，请重试!",
  52003: "用户未授权！"
};

export const translate = (word: string): void => {
  const q = word;
  const to = /[a-zA-Z]/.test(word[0]) ? "zh" : "en";
  const salt = Math.random();
  const sign = md5(appid + q + salt + key);
  const query = querystring.stringify({
    q,
    from: "auto",
    to,
    appid,
    salt,
    sign
  });
  const options = {
    hostname: "api.fanyi.baidu.com",
    port: 443,
    path: "/api/trans/vip/translate?" + query,
    method: "GET"
  };

  const request = https.request(options, response => {
    let chunks: Buffer[] = [];
    response.on("data", chunk => {
      chunks.push(chunk);
    });
    response.on("end", () => {
      const string = Buffer.concat(chunks).toString();
      const object: BaiduTranslate = JSON.parse(string);

      if (object.error_code) {
        console.error(errorMap[object.error_code] || object.error_msg);
        process.exit(2);
      } else {
        process.stdout.write(object.trans_result[0].dst);
        process.exit(0);
      }
    });
  });

  request.on("error", e => {
    console.error(e);
  });
  request.end();
};
