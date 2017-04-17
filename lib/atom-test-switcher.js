'use babel';

// import AtomTestSwitcherView from './atom-test-switcher-view';
import fs from 'fs';
import path from 'path';
import globToRegExp from 'glob-to-regexp';
import { CompositeDisposable } from 'atom';

export default {

  // atomTestSwitcherView: null,
  // modalPanel: null,
  // TODO: optionへ移行
  appDirs: ["app", "lib", "src"],
  testPatterns: ["test/**/test_*.rb", "spec/**/*_spec.rb"],
  relativePath: null,
  subscriptions: null,

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
    }
    if (this.isTestFile()) {
      this.swithSourceFile();
    }
  },

  isSorceFile() {
    const pattern = new RegExp("^(" + this.appDirs.join("|") + ")\/.*\.rb$" );
    return pattern.test(this.relativePath);
  },

  isTestFile() {
    return this.testPatterns.some((element, index, array) => {
      return globToRegExp(element, {globstar: true}).test(this.relativePath);
    });
  },

  swithSourceFile() {
    this.testPatterns.forEach((element, index, array) => {
      if (globToRegExp(element, {globstar: true}).test(this.relativePath)) {
        const reDirname = new RegExp(path.dirname(element).replace("/", "\/").replace("**", "(.*)\/"));
        const reBasename = new RegExp(path.basename(element).replace("*", "(.*)"));

        const dirnameCaptures = reDirname.exec(this.relativePath);
        const basenameCaptures = reBasename.exec(this.relativePath);
        const dirname = dirnameCaptures ? dirnameCaptures[1] : "";
        const basename = basenameCaptures ? basenameCaptures[1] : "";

        const extname = path.extname(element);
        this.appDirs.some((appDir, index, array) => {
          const target = path.join(appDir, dirname, basename + extname);
          const rootPath = atom.project.rootDirectories[0].path;
          if (fs.existsSync(path.join(rootPath, target))) {
            this.openFile(target);
            return true;
          }
        });
      }
    });
  },

  switchTestFile() {
    const rootPath = atom.project.rootDirectories[0].path;
    let testDir = null;
    if (fs.existsSync(path.join(rootPath, 'test'))) {
      testDir = 'test';
    }
    if (fs.existsSync(path.join(rootPath, 'spec'))) {
      testDir = 'spec';
    }

    for (var i = 0; i < this.testPatterns.length; i++) {
      const testPattern = this.testPatterns[i];
      const testDirRe = new RegExp("^" + testDir + "/");
      if (testDirRe.test(testPattern)) {
        const tmp = this.relativePath.split("/").slice(1).join("/");
        const dirname = path.dirname(tmp) == "." ? "" : path.dirname(tmp);
        const basename = path.basename(tmp).split(".")[0];
        const target = testPattern.replace("**", dirname).replace("*", basename);
        this.openFile(target);
      }
    }
  },

  openFile(path) {
    console.log("open: " + path);
    atom.workspace.open(path, {searchAllPanes: true});
  }
};
