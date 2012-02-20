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
import org.eclipse.swt.graphics.*;
import org.eclipse.swt.widgets.*;

/**
 * Label example snippet: create a label (with an image).
 * 
 * For a list of all SWT example snippets see
 * http://www.eclipse.org/swt/snippets/
 */
public class Snippet34 {

	public static void main(String[] args) {
		Display display = new Display();
		Image image = new Image(display, "tree_open.gif", 16, 16);
		// Color color = display.getSystemColor (SWT.COLOR_RED);
		// GC gc = new GC (image);
		// gc.setBackground (color);
		// gc.fillRectangle (image.getBounds ());
		// gc.dispose ();
		Shell shell = new Shell(display);
		Label label = new Label(shell, SWT.BORDER);
		label.setText("lksdjf的但立刻加多少里放斯蒂芬离开家热不能");
		label.setImage(image);
		label.pack();
		shell.pack();
		shell.open();
		// while (!shell.isDisposed ()) {
		// if (!display.readAndDispatch ()) display.sleep ();
		// }
		// image.dispose ();
		// display.dispose ();
	}

}
