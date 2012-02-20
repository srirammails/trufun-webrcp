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
import org.eclipse.swt.graphics.Image;
import org.eclipse.swt.widgets.*;

/**
 * ToolBar example snippet: create a tool bar (text).
 * 
 * For a list of all SWT example snippets see
 * http://www.eclipse.org/swt/snippets/
 */
public class Snippet18 {

	public static void main(String[] args) {
		Shell shell = new Shell();
		ToolBar bar = new ToolBar(shell, SWT.BORDER);
		for (int i = 0; i < 8; i++) {
			ToolItem item = new ToolItem(bar, SWT.PUSH);
			item.setText("Item " + i);
			item.setImage(new Image(shell.getDisplay(), "tree_open.gif", 16, 16));
		}
		bar.pack();
		shell.open();
		Display display = shell.getDisplay();
		// while (!shell.isDisposed()) {
		// if (!display.readAndDispatch ()) display.sleep ();
		// }
		// display.dispose ();
	}
}
