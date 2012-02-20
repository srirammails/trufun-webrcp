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
import org.eclipse.swt.layout.*;

/**
 * CoolBar example snippet: create a coolbar (relayout when resized).
 * 
 * For a list of all SWT example snippets see
 * http://www.eclipse.org/swt/snippets/
 * 
 * @since 3.0
 */
public class Snippet150 {

	static int itemCount;

	static CoolItem createItem(CoolBar coolBar, int count) {
		final ToolBar toolBar = new ToolBar(coolBar, SWT.FLAT);
		for (int i = 0; i < count; i++) {
			ToolItem item = new ToolItem(toolBar, SWT.PUSH);
			item.setText(itemCount++ + "");
		}
		final CoolItem item = new CoolItem(coolBar, SWT.NONE);
		item.setControl(toolBar);

		coolBar.getDisplay().asyncExec(new Runnable() {

			@Override
			public void run() {
				toolBar.pack();
				Point size = toolBar.getSize();
				Point preferred = item.computeSize(size.x, size.y);
				item.setPreferredSize(preferred);
			}
		});

		return item;
	}

	public static void main(String[] args) {
		Display display = new Display();
		final Shell shell = new Shell(display);
		CoolBar coolBar = new CoolBar(shell, SWT.NONE);
		createItem(coolBar, 3);
		createItem(coolBar, 2);
		createItem(coolBar, 3);
		createItem(coolBar, 4);
		int style = SWT.BORDER | SWT.H_SCROLL | SWT.V_SCROLL;
		Text text = new Text(shell, style);
		FormLayout layout = new FormLayout();
		shell.setLayout(layout);
		FormData coolData = new FormData();
		coolData.left = new FormAttachment(0);
		coolData.right = new FormAttachment(100);
		coolData.top = new FormAttachment(0);
		coolBar.setLayoutData(coolData);
		coolBar.addListener(SWT.Resize, new Listener() {
			public void handleEvent(Event event) {
				shell.layout();
			}
		});
		FormData textData = new FormData();
		textData.left = new FormAttachment(0);
		textData.right = new FormAttachment(100);
		textData.top = new FormAttachment(coolBar);
		textData.bottom = new FormAttachment(100);
		text.setLayoutData(textData);
		shell.open();
		// while (!shell.isDisposed()) {
		// if (!display.readAndDispatch()) display.sleep();
		// }
		// display.dispose();
	}
}
