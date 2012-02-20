/*******************************************************************************
 * Copyright (c) 2000, 2004 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.trufun.webrcp.swt.demos.client.demos;

import org.eclipse.swt.*;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.events.SelectionListener;
import org.eclipse.swt.widgets.*;

/**
 * ProgressBar example snippet: update a progress bar (from the UI thread).
 * 
 * For a list of all SWT example snippets see
 * http://www.eclipse.org/swt/snippets/
 */
public class Snippet57 {

	public static void main(String[] args) {
		Display display = new Display();
		Shell shell = new Shell(display);
		final ProgressBar bar = new ProgressBar(shell, SWT.SMOOTH);
		bar.setBounds(10, 10, 200, 40);
		Button btn = new Button(shell, SWT.PUSH);
		btn.setBounds(10, 80, 100, 40);
		btn.addSelectionListener(new SelectionListener() {

			public void widgetSelected(SelectionEvent e) {
				bar.setSelection(bar.getSelection() + 1);
			}

			public void widgetDefaultSelected(SelectionEvent e) {
				// TODO Auto-generated method stub

			}
		});
		shell.pack();
		shell.open();
		// for (int i=0; i<=bar.getMaximum (); i++) {
		// try {Thread.sleep (100);} catch (Throwable th) {}
		// bar.setSelection (i);
		// }
		// while (!shell.isDisposed ()) {
		// if (!display.readAndDispatch ()) display.sleep ();
		// }
		// display.dispose ();
	}
}
