'use babel';

export default class PatternParser {

  // Result Example:
  // [
  //   {
  //     pattern: "test/**/test_foo.rb",
  //     testDir: "test",
  //     testFile: {
  //       pattern: "test_foo.rb",
  //       prefix: "test_",
  //       suffix: "",
  //       ext: "rb"
  //   }
  // ]
  parse(patterns) {
    return patterns.map((element) => {
      const c = /^(.+)\/\*\*\/((.*)\*(.*)\.(.*))/.exec(element);
      return {
        pattern: element,
        testDir: c[1],
        testFile: {
          pattern: c[2],
          prefix: c[3],
          suffix: c[4],
          ext: c[5]
        }
      };
    });
  }
}
