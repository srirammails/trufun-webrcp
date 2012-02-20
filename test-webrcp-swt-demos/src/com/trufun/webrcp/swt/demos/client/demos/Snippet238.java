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

import org.eclipse.swt.*;
import org.eclipse.swt.widgets.*;

/**
 * Menu example snippet: create a popup menu with a submenu.
 * 
 * For a list of all SWT example snippets see
 * http://www.eclipse.org/swt/snippets/
 */
public class Snippet238 {

	public static void main(String[] args) {
		Display display = new Display();
		Shell shell = new Shell(display);
		Button composite = new Button(shell, SWT.BORDER | SWT.PUSH);
		composite.setSize(100, 100);
		composite.setLocation(20, 30);
		Menu menu = new Menu(shell, SWT.POP_UP);
		MenuItem item1 = new MenuItem(menu, SWT.PUSH);
		item1.setText("Push Item");
		MenuItem item2 = new MenuItem(menu, SWT.CASCADE);
		item2.setText("Cascade Item");
		Menu subMenu = new Menu(menu);
		item2.setMenu(subMenu);
		MenuItem subItem1 = new MenuItem(subMenu, SWT.PUSH);
		subItem1.setText("Subitem 1");
		MenuItem subItem2 = new MenuItem(subMenu, SWT.PUSH);
		subItem2.setText("Subitem 2");
		composite.setMenu(menu);
		// shell.setMenu (menu);
		shell.setSize(300, 300);
		shell.open();
		// while (!shell.isDisposed ()) {
		// if (!display.readAndDispatch ()) display.sleep ();
		// }
		// display.dispose ();
	}
}
