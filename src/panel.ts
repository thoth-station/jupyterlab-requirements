/**
 * Jupyterlab requirements.
 *
 * Jupyterlab extension for managing dependencies.
 *
 * @link   https://github.com/thoth-station/jupyterlab-requirements#readme
 * @file   Jupyterlab extension for managing dependencies.
 * @author Francesco Murdaca <fmurdaca@redhat.com>
 * @since  0.1.0
 */

import {
    ITranslator,
    nullTranslator,
    TranslationBundle
  } from '@jupyterlab/translation';
  import { StackedPanel } from '@lumino/widgets';
  
  import { ButtonWidget, ICount } from './button';
  /**
   * The class name added to console panels.
   */
  const PANEL_CLASS = 'jp-tutorial-view';
  
  /**
   * A panel which contains a console and the ability to add other children.
   */
  export class SignalExamplePanel extends StackedPanel {
    constructor(translator?: ITranslator) {
      super();
      this._translator = translator || nullTranslator;
      this._trans = this._translator.load('jupyterlab');
      this.addClass(PANEL_CLASS);
      this.id = 'SignalExamplePanel';
      this.title.label = this._trans.__('Signal Example View');
      this.title.closable = true;
  
      this._widget = new ButtonWidget();
      this.addWidget(this._widget);
      this._widget.stateChanged.connect(this._logMessage, this);
    }
  
    private _logMessage(emitter: ButtonWidget, count: ICount): void {
      console.log('Hey, a Signal has been received from', emitter);
      console.log(
        `Thoth Station is working on it! Button clicked ${count.clickCount} times.`
      );
      window.alert(
        `Thoth Station is working on it! Button clicked ${count.clickCount} times.`
      );
    }
  
    private _widget: ButtonWidget;
  
    private _translator: ITranslator;
    private _trans: TranslationBundle;
  }