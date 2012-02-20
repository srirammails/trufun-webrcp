/*******************************************************************************
 * Copyright (c) 2000, 2006 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.trufun.webrcp.swt.demos.client.demos;

import org.eclipse.swt.SWT;
import org.eclipse.swt.graphics.*;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.swt.widgets.*;
import org.eclipse.swt.events.*;

/**
 * Canvas snippet: paint a circle in a canvas.
 * 
 * For a list of all SWT example snippets see
 * http://www.eclipse.org/swt/snippets/
 */
public class Snippet245 {

	public static void main(String[] args) {
		final Display display = new Display();
		final Shell shell = new Shell(display);
		shell.setLayout(new FillLayout());
		final Canvas c = new Canvas(shell, SWT.None);
		// c.setSize(200, 200);
		c.addPaintListener(new PaintListener() {
			public void paintControl(PaintEvent event) {
				Rectangle rect = c.getBounds();// .getClientArea();
				System.out.println(rect);
				event.gc.drawOval(0, 0, rect.width - 1, rect.height - 1);
				event.gc.drawRectangle(0, 0, rect.width - 1, rect.height - 1);
			}
		});
		shell.setBounds(10, 10, 500, 500);
		shell.open();
		// while (!shell.isDisposed()) {
		// if (!display.readAndDispatch()) display.sleep();
		// }
		// display.dispose();
	}
}
