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
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.widgets.*;

/**
 * TabFolder example snippet: create a tab folder (six pages).
 * 
 * For a list of all SWT example snippets see
 * http://www.eclipse.org/swt/snippets/
 */
public class Snippet76 {

	public static void main(String[] args) {
		Display display = new Display();
		final Shell shell = new Shell(display);
		shell.setLayout(new FillLayout());
		final TabFolder tabFolder = new TabFolder(shell, SWT.BORDER);
		for (int i = 0; i < 6; i++) {
			TabItem item = new TabItem(tabFolder, SWT.NONE);
			item.setText("TabItem " + i);
			Button button = new Button(tabFolder, SWT.PUSH);
			button.setText("Page " + i);
			item.setControl(button);
		}
		tabFolder.pack();
		shell.pack();
		shell.open();
		// while (!shell.isDisposed ()) {
		// if (!display.readAndDispatch ()) display.sleep ();
		// }
		// display.dispose ();
	}
}
