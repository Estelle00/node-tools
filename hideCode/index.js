const rep = {
  '00': '\u200b',
  '01': '\u200c',
  '10': '\u200d',
  '11': '\uFEFF'
};
function hide(str) {
  str = str.replace(/[^\x00-\xff]/g, function(a) { // 转码 Latin-1 编码以外的字符。
    return escape(a).replace('%', '\\');
  });

  str = str.replace(/[\s\S]/g, function(a) { // 处理二进制数据并且进行数据替换
    a = a.charCodeAt().toString(2);
    a = a.length < 8 ? Array(9 - a.length).join('0') + a : a;
    return a.replace(/../g, function(a) {
      return rep[a];
    });
  });
  return str;
}
const tpl = '("@code".replace(/.{4}/g,function(a){var rep={"\u200b":"00","\u200c":"01","\u200d":"10","\uFEFF":"11"};return String.fromCharCode(parseInt(a.replace(/./g, function(a) {return rep[a]}),2))}))';

const hider = function(code, type) {
  var str = hide(code); // 生成零宽字符串

  str = tpl.replace('@code', str); // 生成模版
  return str;
};

// 零宽字符
console.log(hider("123"));
