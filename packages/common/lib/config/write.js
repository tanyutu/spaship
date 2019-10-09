// Write a spaship.yaml file
//
// TODO copy code over from @spaship/cli

const fsp = require("fs").promises;
const yaml = require("js-yaml");
const pkg = require("../../package.json");
const validate = require("./validate");

async function write(filename, data) {
  const heading = `# SPAship config file
# generated by @spaship/common.config v${pkg.version}

`;

  const valid = validate(data);
  if (!valid) {
    console.warn(`WARNING: configuration is invalid, `, data);
  }

  const content = heading + yaml.safeDump(data);
  await fsp.writeFile(filename, content);
  return data;
}

module.exports = write;

if (require.main === module) {
  write("spaship.yaml", { name: "Foo", path: "/foo/bar", single: true }).then(
    data => {
      console.log("wrote the following data", data);
    }
  );
  write("spaship2.yaml", {
    name: "Foo",
    path: "/foo/bar",
    single: true,
    deploykey: "dk-abcdefgh"
  }).then(data => {
    console.log("wrote the following data", data);
  });
  write("spaship3.yaml", {
    name: "Foo",
    BAD_PROPERTY: "nope",
    path: "/foo/bar",
    single: true,
    deploykey: "dk-abcdefgh"
  }).then(data => {
    console.log("wrote the following data", data);
  });
}