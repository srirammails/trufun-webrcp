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
import org.eclipse.swt.events.SelectionAdapter;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.graphics.Image;
import org.eclipse.swt.widgets.*;

import com.google.gwt.core.client.GWT;

/**
 * Menu example snippet: create a bar and pull down menu (accelerators,
 * mnemonics).
 * 
 * For a list of all SWT example snippets see
 * http://www.eclipse.org/swt/snippets/
 */
public class Snippet29 {

	public static void main(String[] args) {
		Display display = new Display();
		Shell shell = new Shell(display);
		Menu bar = new Menu(shell, SWT.BAR);
		shell.setMenuBar(bar);
		MenuItem fileItem = new MenuItem(bar, SWT.CASCADE);
		fileItem.setText("&File");
		Menu submenu = new Menu(shell, SWT.DROP_DOWN);
		fileItem.setMenu(submenu);
		MenuItem item = new MenuItem(submenu, SWT.PUSH);
		item.setImage(new Image(display, GWT.getModuleBaseURL()
				+ "icons/close_icon.gif"));
		item.addListener(SWT.Selection, new Listener() {
			public void handleEvent(Event e) {
				System.out.println("Select All");
			}
		});
		item.setText("Select &All\tCtrl+A");
		item.setAccelerator(SWT.MOD1 + 'A');
		item = new MenuItem(submenu, SWT.RADIO);
		item.setText("Itemdd ");
		item.addSelectionListener(new SelectionAdapter() {
			public void widgetSelected(SelectionEvent e) {
				MenuItem item = (MenuItem) e.widget;
				if (item.getSelection()) {
					System.out.println(item + " selected");
				} else {
					System.out.println(item + " unselected");
				}
			}
		});
		item = new MenuItem(submenu, SWT.CHECK);
		item.setText("Itemdd2 ");
		item.addSelectionListener(new SelectionAdapter() {
			public void widgetSelected(SelectionEvent e) {
				MenuItem item = (MenuItem) e.widget;
				if (item.getSelection()) {
					System.out.println(item + " selected");
				} else {
					System.out.println(item + " unselected");
				}
			}
		});
		shell.setSize(200, 200);
		shell.open();
		// while (!shell.isDisposed()) {
		// if (!display.readAndDispatch ()) display.sleep ();
		// }
		// display.dispose ();
	}

}
