const config = require('../config.js');
const plugins = [];

const addPlugin = (pluginsInfo, runFunction) => {
  
  const prefix = (config.PREFIX == "false" ? '^' : config.PREFIX).split('').length > 0x1 && (config.PREFIX[0] === config.PREFIX[1]) ? config.PREFIX : /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/.test(config.PREFIX == "false" ? '^' : config.PREFIX) && (config.PREFIX != "false") ? `^[${config.PREFIX == "false" ? '^' : config.PREFIX}]` : (config.PREFIX == "false" ? '^' : config.PREFIX);

  pluginsInfo.function = runFunction;
  pluginsInfo.pattern = new RegExp(prefix + "\\s*" + pluginsInfo.pattern + "\\s*(?!\\S)(.*)$", "i");
  pluginsInfo.desc = pluginsInfo.desc || "No description provided";
  pluginsInfo.fromMe = config.WORK_TYPE === 'private' ? pluginsInfo.forcePublic === true ? false : true : config.WORK_TYPE === 'public' ? pluginsInfo.fromMe : false;
  pluginsInfo.category = pluginsInfo.category || "misc";
  if (pluginsInfo['on'] === undefined && pluginsInfo['pattern'] === undefined) {
    pluginsInfo.on = 'message';
    pluginsInfo.fromMe = false;
  }
 if (!(pluginsInfo.pattern === undefined && pluginsInfo.pattern)) {
    pluginsInfo.dontAddCommandList = false;
  }
  if (pluginsInfo.on) {
    pluginsInfo.dontAddCommandList = true;
  }

  plugins.push(pluginsInfo);
  return pluginsInfo;
};

module.exports = {addPlugin,plugins};
