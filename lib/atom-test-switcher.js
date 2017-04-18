'use babel';

// import AtomTestSwitcherView from './atom-test-switcher-view';
import PatternParser from './pattern-parser';
import unique from './utils/unique';

import fs from 'fs';
import path from 'path';
import globToRegExp from 'glob-to-regexp';
import { CompositeDisposable } from 'atom';

export default {

  // atomTestSwitcherView: null,
  // modalPanel: null,
  appDirs: null,
  testPatterns: null,
  relativePath: null,
  subscriptions: null,
  parser: new PatternParser(),

  config: {
    appDirs: {
      title: 'Application directories',
      description: 'A comma-separated list of source directories.',
      type: 'array',
      default: ["app", "lib", "src"],
      items: {
        type: 'string'
      }
    },
    testPatterns: {
      title: 'test file patterns',
      description: 'A comma-separated list of test file patterns.',
      type: 'array',
      default: ["test/**/test_*.rb", "spec/**/*_spec.rb", "spec/**/*-spec.js"],
      items: {
        type: 'string'
      }
    }
  },

  initialize(state) {
    this.appDirs = atom.config.get('atom-test-switcher.appDirs');
    const patterns = atom.config.get('atom-test-switcher.testPatterns');
    this.testPatterns = this.parser.parse(patterns);
  },

  activate(state) {
    // this.atomTestSwitcherView = new AtomTestSwitcherView(state.atomTestSwitcherViewState);
    // this.modalPanel = atom.workspace.addModalPanel({
    //   item: this.atomTestSwitcherView.getElement(),
    //   visible: false
    // });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-test-switcher:switch': () => this.switch()
    }));
  },

  deactivate() {
    // this.modalPanel.destroy();
    this.subscriptions.dispose();
    // this.atomTestSwitcherView.destroy();
  },

  serialize() {
    // return {
    //   atomTestSwitcherViewState: this.atomTestSwitcherView.serialize()
    // };
  },

  switch() {
    const fullPath = atom.workspace.getActivePaneItem().getURI();
    this.relativePath = atom.project.relativize(fullPath);

    if (this.isSorceFile()) {
      this.switchTestFile();
    } else {
      this.swithSourceFile();
    }
  },

  isSorceFile() {
    let extnames = this.testPatterns.map((element) => { return element.testFile.ext; });
    extnames = unique(extnames);
    const pattern = new RegExp("^(" + this.appDirs.join("|") + ")\/.*\.(" + extnames.join("|") + ")$" );
    return pattern.test(this.relativePath);
  },

  swithSourceFile() {
    this.testPatterns.some((element, index, array) => {
      if (!globToRegExp(element.pattern, {globstar: true}).test(this.relativePath)) {
        return;
      }
      // regexp example:
      // /spec\/?(.*)\/(.+)-spec.js/
      const re = new RegExp(element.testDir + "\/?(.*)\/" + element.testFile.prefix + "(.+)"
        + element.testFile.suffix + "\." + element.testFile.ext);
      const captures = re.exec(this.relativePath);
      if (captures.length < 2) {
        return;
      }
      const dirname = captures[1];
      const basename = captures[2];
      this.appDirs.some((appDir, index, array) => {
        const target = path.join(appDir, dirname, basename + "." + element.testFile.ext);
        if (this.isProjectPath(target)) {
          this.openFile(target);
          return true;
        }
      });
    });
  },

  switchTestFile() {
    const testDir = this.fiindTestDir();
    const srcExt = path.extname(this.relativePath).slice(1);

    for (var i = 0; i < this.testPatterns.length; i++) {
      const testPattern = this.testPatterns[i];
      if (testPattern.testFile.ext !== srcExt) {
        continue;
      }
      const testDirRe = new RegExp("^" + testDir + "/");
      if (testDirRe.test(testPattern.pattern)) {
        const tmp = this.relativePath.split("/").slice(1).join("/");
        const dirname = path.dirname(tmp) == "." ? "" : path.dirname(tmp);
        const basename = path.basename(tmp).split(".")[0];
        // const target = testPattern.pattern.replace("**", dirname).replace("*", basename);
        const target = path.join(testDir, dirname,
          testPattern.testFile.prefix + basename + testPattern.testFile.suffix + "." + testPattern.testFile.ext);
        this.openFile(target)
        break;
      }
    }
  },

  openFile(path) {
    if (!path) {
      return;
    }
    atom.workspace.open(path, {searchAllPanes: true});
  },

  fiindTestDir() {
    let testDir = "";
    this.testPatterns.some((element) => {
      if (this.isProjectPath(element.testDir)) {
        testDir = element.testDir;
        return true;
      }
    });
    return testDir;
  },

  isProjectPath(file) {
    const rootPath = atom.project.rootDirectories[0].path;
    return fs.existsSync(path.join(rootPath, file));
  }
};
