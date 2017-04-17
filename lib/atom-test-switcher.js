'use babel';

import AtomTestSwitcherView from './atom-test-switcher-view';
import { CompositeDisposable } from 'atom';

export default {

  atomTestSwitcherView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.atomTestSwitcherView = new AtomTestSwitcherView(state.atomTestSwitcherViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomTestSwitcherView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-test-switcher:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.atomTestSwitcherView.destroy();
  },

  serialize() {
    return {
      atomTestSwitcherViewState: this.atomTestSwitcherView.serialize()
    };
  },

  toggle() {
    console.log('AtomTestSwitcher was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
