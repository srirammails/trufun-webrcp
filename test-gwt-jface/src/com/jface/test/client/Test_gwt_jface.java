package com.jface.test.client;

import org.eclipse.swt.SWT;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.widgets.Button;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Event;
import org.eclipse.swt.widgets.Listener;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.swt.widgets.adpater.WidgetAdpaterManager;
import org.eclipse.swt.widgets.adpater.qx.AdapterFactory;
import org.eclipse.swt.widgets.adpater.qx.app.SWTApp;
import org.ufacekit.qx.wrapper.application.QooxdooApp;
import org.ufacekit.qx.wrapper.application.QxAbstractGui;

import com.jface.test.shared.FieldVerifier;
import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.GWT;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class Test_gwt_jface extends SWTApp {// implements EntryPoint {

	/**
	 * This is the entry point method.
	 */
	public void run() {
		Display display = new Display();
		final Shell shell = new Shell(display);

		shell.setLayout(new GridLayout(6, true));
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Dialog Examples");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					DialogExamples.main(null);
				}
			});
		}
		// {
		// Button button = new Button (shell, SWT.PUSH);
		// button.setText ("TableStaticTooltip");
		// button.addListener (SWT.Selection, new Listener () {
		// public void handleEvent (Event e) {
		// Snippet031TableStaticTooltip.main(null);
		// }
		// });
		// }
		{
			Button button = new Button(shell, SWT.PUSH);
			button.setText("Application");
			button.addListener(SWT.Selection, new Listener() {
				public void handleEvent(Event e) {
					Bla.main(null);
				}
			});
		}
		shell.pack();
		shell.open();
	}
}
